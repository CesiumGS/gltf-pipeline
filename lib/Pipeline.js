'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var path = require('path');

var AmbientOcclusion = require('./AmbientOcclusion');
var RemoveUnusedElements = require('./RemoveUnusedElements');
var addDefaults = require('./addDefaults');
var addPipelineExtras = require('./addPipelineExtras');
var cacheOptimization = require('./cacheOptimization');
var combineMeshes = require('./combineMeshes');
var combineNodes = require('./combineNodes');
var compressIntegerAccessors = require('./compressIntegerAccessors');
var compressTextureCoordinates = require('./compressTextureCoordinates');
// var combinePrimitives = require('./combinePrimitives');
var convertDagToTree = require('./convertDagToTree');
var encodeImages = require('./encodeImages');
var generateNormals = require('./generateNormals');
var loadGltfUris = require('./loadGltfUris');
var mergeDuplicateVertices = require('./mergeDuplicateVertices');
var mergeDuplicateAccessors = require('./mergeDuplicateAccessors');
var octEncodeNormals = require('./octEncodeNormals');
var readGltf = require('./readGltf');
var removeDuplicatePrimitives = require('./removeDuplicatePrimitives');
var quantizeAttributes = require('./quantizeAttributes');
var writeGltf = require('./writeGltf');
var writeBinaryGltf = require('./writeBinaryGltf');
var writeSource = require('./writeSource');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var bakeAmbientOcclusion = AmbientOcclusion.bakeAmbientOcclusion;
var removeAllUnused = RemoveUnusedElements.removeAllUnused;

module.exports = Pipeline;

/**
 * Main optimization pipeline.
 * @constructor
 */
function Pipeline() {}

/**
 * Add pipeline extras and load uris, then process the gltf.
 * Options are passed to loadGltfUris and processJSONWithExtras.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {Object} options Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves to the processed gltf.
 *
 * @see loadGltfUris
 * @see Pipeline.processJSONWithExtras
 */
Pipeline.processJSON = function(gltf, options) {
    addPipelineExtras(gltf);
    return loadGltfUris(gltf, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeSources(gltf);
        });
};

/**
 * Process a gltf that already has extras and loaded uris.
 *
 * @param {Object} gltfWithExtras A javascript object holding a glTF hierarchy with extras.
 * @param {Object} options Options to apply to stages during optimization.
 * @param {Object} [options.aoOptions=undefined] Options to pass to the bakeAmbientOcclusion stage, if undefined, stage is not run.
 * @param {Object} [options.encodeNormals=false] Flag to run octEncodeNormals stage.
 * @param {Object} [options.compressTextureCoordinates=false] Flag to run compressTextureCoordinates stage.
 * @param {Object} [options.quantize] Flag to run quantizeAttributes stage.
 * @returns {Promise} A promise that resolves to the processed gltf.
 */
Pipeline.processJSONWithExtras  = function(gltfWithExtras, options) {
    addDefaults(gltfWithExtras, options);
    removeAllUnused(gltfWithExtras);
    // It is generally better to merge the duplicate vertices before merging accessors.
    // Once accessors merge, there is more likely to be overlap in accessor usage between primitives
    // which limits the effectiveness of merging duplicate vertices.
    mergeDuplicateVertices(gltfWithExtras);
    mergeDuplicateAccessors(gltfWithExtras);
    removeDuplicatePrimitives(gltfWithExtras);
    convertDagToTree(gltfWithExtras);
    combineNodes(gltfWithExtras);
    combineMeshes(gltfWithExtras);
    generateNormals(gltfWithExtras);
    // TODO: Combine primitives can be uncommented and added back into the pipeline once it is fixed, but right now there are too many issues with it to allow in the main pipeline.
    // combinePrimitives(gltfWithExtras);
    // Merging duplicate vertices again to prevent repeat data in newly combined primitives
    // mergeDuplicateVertices(gltfWithExtras);
    cacheOptimization(gltfWithExtras);

    // run AO after cacheOptimization since AO adds new attributes.
    var aoOptions = options.aoOptions;
    if (defined(aoOptions)) {
        aoOptions.gltfWithExtras = gltfWithExtras;
        bakeAmbientOcclusion(aoOptions);
    }

    // Run removeAllUnused stage again after all pipeline stages have been run to remove objects that become unused
    removeAllUnused(gltfWithExtras);
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
            // Remove duplicates again after all stages to minimize the buffer size
            mergeDuplicateVertices(gltfWithExtras);
            return encodeImages(gltfWithExtras);
        });
};

/**
 * Process a gltf on disk into memory.
 * Options are passed to processJSONWithExtras.
 *
 * @param {String} inputPath The input file path.
 * @param {Object} options Options to apply tos tages during optimization.
 * @returns {Object} The processed gltf.
 *
 * @see Pipeline.processJSONWithExtras
 */
Pipeline.processFile =function processFile(inputPath, options) {
    return readGltf(inputPath, options)
        .then(function(gltf) {
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            return writeSources(gltf);
        });
};

/**
 * Process a gltf in memory and writes it out to disk.
 * Options are passed to loadGltfUris, processJSONWithExtras, writeGltf, and writeBinaryGltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {String} outputPath The output file destination.
 * @param {Object} options Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves when the operation is complete.
 *
 * @see loadGltfUris
 * @see Pipeline.processJSONWithExtras
 * @see writeGltf
 * @see writeBinaryGltf
 */
Pipeline.processJSONToDisk = function(gltf, outputPath, options) {
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
 * Processes a gltf on disk and writes it out to disk.
 * Options are passed to processJSONWithExtras, readGltf, writeGltf, and writeBinaryGltf.
 *
 * @param {String} inputPath The input file path.
 * @param {String} outputPath The output file destination
 * @param {Object} options Options to apply to stages during optimization.
 * @returns {Promise} A promise that resolves when the operation is complete.
 *
 * @see Pipeline.processJSONWithExtras
 * @see readGltf
 * @see writeGltf
 * @see writeBinaryGltf
 */
Pipeline.processFileToDisk = function(inputPath, outputPath, options) {
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

function printStats(stats) {
    process.stdout.write('Nodes removed: ' + stats.numberRemoved.nodes + '\n');
    process.stdout.write('Skins removed: ' + stats.numberRemoved.skins + '\n');
    process.stdout.write('Cameras removed: ' + stats.numberRemoved.cameras + '\n');
    process.stdout.write('Meshes removed: ' + stats.numberRemoved.meshes + '\n');
    process.stdout.write('Accessors removed: ' + stats.numberRemoved.accessors + '\n');
    process.stdout.write('Materials removed: ' + stats.numberRemoved.materials + '\n');
    process.stdout.write('BufferViews removed: ' + stats.numberRemoved.bufferViews + '\n');
    process.stdout.write('Techniques removed: ' + stats.numberRemoved.techniques + '\n');
    process.stdout.write('Textures removed: ' + stats.numberRemoved.textures + '\n');
    process.stdout.write('Buffers removed: ' + stats.numberRemoved.buffers + '\n');
    process.stdout.write('Programs removed: ' + stats.numberRemoved.programs + '\n');
    process.stdout.write('Images removed: ' + stats.numberRemoved.images + '\n');
    process.stdout.write('Samplers removed: ' + stats.numberRemoved.samplers + '\n');
    process.stdout.write('Shaders removed: ' + stats.numberRemoved.shaders + '\n');
}
