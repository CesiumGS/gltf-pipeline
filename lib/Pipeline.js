'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var path = require('path');

var MergeDuplicateProperties = require('./MergeDuplicateProperties');
var RemoveUnusedProperties = require('./RemoveUnusedProperties');
var addDefaults = require('./addDefaults');
var addPipelineExtras = require('./addPipelineExtras');
var bakeAmbientOcclusion = require('./bakeAmbientOcclusion');
var combineMeshes = require('./combineMeshes');
var combineNodes = require('./combineNodes');
var combinePrimitives = require('./combinePrimitives');
var compressIntegerAccessors = require('./compressIntegerAccessors');
var compressTextureCoordinates = require('./compressTextureCoordinates');
var convertDagToTree = require('./convertDagToTree');
var encodeImages = require('./encodeImages');
var generateModelMaterialsCommon = require('./generateModelMaterialsCommon');
var generateNormals = require('./generateNormals');
var generateTangentsBitangents = require('./generateTangentsBitangents');
var getStatistics = require('./getStatistics');
var loadGltfUris = require('./loadGltfUris');
var mergeDuplicateVertices = require('./mergeDuplicateVertices');
var octEncodeNormals = require('./octEncodeNormals');
var optimizeForVertexCache = require('./optimizeForVertexCache');
var processModelMaterialsCommon = require('./processModelMaterialsCommon');
var readGltf = require('./readGltf');
var removeDuplicatePrimitives = require('./removeDuplicatePrimitives');
var removeNormals = require('./removeNormals');
var removePipelineExtras = require('./removePipelineExtras');
var quantizeAttributes = require('./quantizeAttributes');
var updateVersion = require('./updateVersion');
var writeGltf = require('./writeGltf');
var writeBinaryGltf = require('./writeBinaryGltf');
var writeSource = require('./writeSource');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = Pipeline;

/**
 * Main optimization pipeline.
 * @constructor
 */
function Pipeline() {}

/**
 * Add pipeline extras and load uris, then process the glTF asset.
 * Options are passed to loadGltfUris and processJSONWithExtras.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves to the processed glTF asset.
 *
 * @see loadGltfUris
 * @see Pipeline.processJSONWithExtras
 */
Pipeline.processJSON = function(gltf, options) {
    options = defaultValue(options, {});
    addPipelineExtras(gltf);
    return loadGltfUris(gltf, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeSources(gltf);
        })
        .then(function(gltf) {
            gltf = removePipelineExtras(gltf);
            return gltf;
        });
};

/**
 * Process a glTF asset that already has extras and loaded uris.
 *
 * @param {Object} gltfWithExtras A javascript object holding a glTF hierarchy with extras.
 * @param {Object} [options] Options to apply to stages during optimization.
 * @param {Object} [options.aoOptions=undefined] Options to pass to the bakeAmbientOcclusion stage, if undefined, stage is not run.
 * @param {Object} [options.encodeNormals=false] Flag to run octEncodeNormals stage.
 * @param {Object} [options.compressTextureCoordinates=false] Flag to run compressTextureCoordinates stage.
 * @param {Object} [options.quantize] Flag to run quantizeAttributes stage.
 * @returns {Promise} A promise that resolves to the processed glTF asset.
 */
Pipeline.processJSONWithExtras  = function(gltfWithExtras, options) {
    options = defaultValue(options, {});

    updateVersion(gltfWithExtras, options);
    addDefaults(gltfWithExtras, options);
    processModelMaterialsCommon(gltfWithExtras, options);

    // Print statistics for unoptimized input
    if (options.stats) {
        console.log('\nStatistics for ' + options.inputPath + '\n------------------');
        console.log(getStatistics(gltfWithExtras).toString());
    }

    var shouldRemoveNormals = defaultValue(options.removeNormals, false);
    var shouldPreserve = defaultValue(options.preserve, false);
    if (shouldRemoveNormals) {
        removeNormals(gltfWithExtras);
    }

    RemoveUnusedProperties.removeAll(gltfWithExtras);
    generateNormals(gltfWithExtras, options);
    if (!shouldPreserve) {
        mergeDuplicateVertices(gltfWithExtras);
        MergeDuplicateProperties.mergeAll(gltfWithExtras);
        RemoveUnusedProperties.removeAll(gltfWithExtras);
        removeDuplicatePrimitives(gltfWithExtras);
        combinePrimitives(gltfWithExtras);
        convertDagToTree(gltfWithExtras);
        combineNodes(gltfWithExtras);
        combineMeshes(gltfWithExtras);
        combinePrimitives(gltfWithExtras);
        MergeDuplicateProperties.mergeAll(gltfWithExtras);
        removeDuplicatePrimitives(gltfWithExtras);
        RemoveUnusedProperties.removeAll(gltfWithExtras);
        optimizeForVertexCache(gltfWithExtras);
    }

    // run generation of tangents / bitangents and AO after
    // optimizeForVertexCache since those steps add new attributes.
    if (options.tangentsBitangents) {
        generateTangentsBitangents(gltfWithExtras);
    }

    var aoOptions = options.aoOptions;
    if (defined(aoOptions) && aoOptions.enabled) {
        bakeAmbientOcclusion(gltfWithExtras, aoOptions);
    }

    var waitForStages = [new Promise(function(resolve) {resolve();})];
    if (options.encodeNormals) {
        waitForStages.push(octEncodeNormals(gltfWithExtras));
    }
    if (options.compressTextureCoordinates) {
        waitForStages.push(compressTextureCoordinates(gltfWithExtras));
    }
    waitForStages.push(compressIntegerAccessors(gltfWithExtras, {
        semantics : ["JOINT"]
    }));
    return Promise.all(waitForStages)
        .then(function() {
            if (options.quantize) {
                var quantizedOptions = {
                    findMinMax : true,
                    exclude : [
                        'JOINT',
                        '_OCCLUSION'
                    ]
                };
                if (options.compressTextureCoordinates) {
                    quantizedOptions.exclude.push('TEXCOORD');
                }
                quantizeAttributes(gltfWithExtras, quantizedOptions);
            }
            return encodeImages(gltfWithExtras);
        })
        .then(function() {
            var kmcOptions = options.kmcOptions;
            if (defined(kmcOptions) && kmcOptions.enable) {
                generateModelMaterialsCommon(gltfWithExtras, options.kmcOptions);
            }

            // Print statistics for optimized glTF
            if (options.stats) {
                console.log('\nStatistics for ' + options.outputPath + '\n------------------');
                console.log(getStatistics(gltfWithExtras).toString() + '\n');
            }

            return gltfWithExtras;
        });
};

/**
 * Process a glTF asset on disk into memory.
 * Options are passed to processJSONWithExtras.
 *
 * @param {String} inputPath The input file path.
 * @param {Object} [options] Options to apply to stages during optimization.
 * @returns {Object} The processed glTF asset.
 *
 * @see Pipeline.processJSONWithExtras
 */
Pipeline.processFile = function processFile(inputPath, options) {
    options = defaultValue(options, {});
    return readGltf(inputPath, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeSources(gltf);
        })
        .then(function(gltf) {
            gltf = removePipelineExtras(gltf);
            return gltf;
        });
};

/**
 * Process a gltf in memory and writes it out to disk.
 * Options are passed to loadGltfUris, processJSONWithExtras, writeGltf, and writeBinaryGltf.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} outputPath The output file destination.
 * @param {Object} [options] Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves when the operation is complete.
 *
 * @see loadGltfUris
 * @see Pipeline.processJSONWithExtras
 * @see writeGltf
 * @see writeBinaryGltf
 */
Pipeline.processJSONToDisk = function(gltf, outputPath, options) {
    options = defaultValue(options, {});
    addPipelineExtras(gltf);
    return loadGltfUris(gltf, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeFile(gltf, outputPath, options);
        });
};

/**
 * Processes a glTF asset on disk and writes it out to disk.
 * Options are passed to processJSONWithExtras, readGltf, writeGltf, and writeBinaryGltf.
 *
 * @param {String} inputPath The input file path.
 * @param {String} outputPath The output file destination
 * @param {Object} [options] Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves when the operation is complete.
 *
 * @see Pipeline.processJSONWithExtras
 * @see readGltf
 * @see writeGltf
 * @see writeBinaryGltf
 */
Pipeline.processFileToDisk = function(inputPath, outputPath, options) {
    options = defaultValue(options, {});
    return readGltf(inputPath, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeFile(gltf, outputPath, options);
        });
};

function writeSources(gltf) {
    var embed = true;
    var embedImage = true;
    var writeSourcePromises = [
        writeSource(gltf, undefined, 'buffers', embed, embedImage),
        writeSource(gltf, undefined, 'images', embed, embedImage),
        writeSource(gltf, undefined, 'shaders', embed, embedImage)
    ];
    return Promise.all(writeSourcePromises)
        .then(function() {
            return gltf;
        });
}

function writeFile(gltf, outputPath, options) {
    var fileExtension = path.extname(outputPath);
    var binary = defaultValue(options.binary, false);
    var embed = defaultValue(options.embed, true);
    var embedImage = defaultValue(options.embedImage, true);
    var createDirectory = defaultValue(options.createDirectory, true);
    var writeOptions = {
        outputPath : outputPath,
        embed : embed,
        embedImage : embedImage,
        createDirectory : createDirectory
    };

    if (binary || fileExtension === '.glb') {
        return writeBinaryGltf(gltf, writeOptions);
    }
    return writeGltf(gltf, writeOptions);
}
