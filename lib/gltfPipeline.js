'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var async = require('async');
var path = require('path');
var defaultValue = Cesium.defaultValue;

var OptimizationStatistics = require('./OptimizationStatistics');
var addDefaults = require('./addDefaults');
var addPipelineExtras = require('./addPipelineExtras');
var cacheOptimization = require('./cacheOptimization');
var combineMeshes = require('./combineMeshes');
var compressTextureCoordinates = require('./compressTextureCoordinates');
// var combinePrimitives = require('./combinePrimitives');
var convertDagToTree = require('./convertDagToTree');
var encodeImages = require('./encodeImages');
var loadGltfUris = require('./loadGltfUris');
var mergeDuplicateVertices = require('./mergeDuplicateVertices');
var mergeDuplicateAccessors = require('./mergeDuplicateAccessors');
var octEncodeNormals = require('./octEncodeNormals');
var readGltf = require('./readGltf');
var removeDuplicatePrimitives = require('./removeDuplicatePrimitives');
var removeUnused = require('./removeUnused');
var quantizeAttributes = require('./quantizeAttributes');
var writeGltf = require('./writeGltf');
var writeBinaryGltf = require('./writeBinaryGltf');
var writeSource = require('./writeSource');

module.exports = {
    processJSON : processJSON,
    processFile : processFile,
    processJSONToDisk : processJSONToDisk,
    processFileToDisk : processFileToDisk
};

function writeSources(gltf, callback) {
    var embed = true;
    var embedImage = true;
    async.each(['buffers', 'images', 'shaders'], function(name, asyncCallback) {
        writeSource(gltf, undefined, name, embed, embedImage, asyncCallback);
    }, function() {
        callback();
    });
}

function processJSON(gltf, options, callback) {
    addPipelineExtras(gltf);
    loadGltfUris(gltf, options)
        .then(function() {
            processJSONWithExtras(gltf, options, function() {
                writeSources(gltf, function() {
                    callback(gltf);
                });
            });
        })
        .catch(function(err) {
            throw err;
        });
}

function processJSONWithExtras(gltfWithExtras, options, callback) {
    var stats = new OptimizationStatistics();
    addDefaults(gltfWithExtras, options);
    removeUnused(gltfWithExtras, stats);
    if (options.printStats) {
        printStats(stats);
    }
    // It is generally better to merge the duplicate vertices before merging accessors.
    // Once accessors merge, there is more likely to be overlap in accessor usage between primitives
    // which limits the effectiveness of merging duplicate vertices.
    mergeDuplicateVertices(gltfWithExtras);
    mergeDuplicateAccessors(gltfWithExtras);
    removeDuplicatePrimitives(gltfWithExtras);
    convertDagToTree(gltfWithExtras);
    combineMeshes(gltfWithExtras);
    // TODO: Combine primitives can be uncommented and added back into the pipeline once it is fixed, but right now there are too many issues with it to allow in the main pipeline.
    // combinePrimitives(gltfWithExtras);
    // Merging duplicate vertices again to prevent repeat data in newly combined primitives
    // mergeDuplicateVertices(gltfWithExtras);
    cacheOptimization(gltfWithExtras);
    // Run removeUnused stage again after all pipeline stages have been run to remove objects that become unused
    removeUnused(gltfWithExtras);
    var waitForStages = [new Promise(function(resolve) {resolve();})];
    if (options.encodeNormals) {
        waitForStages.push(octEncodeNormals(gltfWithExtras));
    }
    if (options.compressTextureCoordinates) {
        waitForStages.push(compressTextureCoordinates(gltfWithExtras));
    }
    Promise.all(waitForStages).then(function() {
        if (options.quantize) {
            var quantizedOptions = {
                findMinMax : true,
                exclude : ['JOINT']
            };
            if (options.compressTextureCoordinates) {
                quantizedOptions.exclude.push('TEXCOORD');
            }
            quantizeAttributes(gltfWithExtras, quantizedOptions);
        }

        // Remove duplicates again after all stages to minimize the buffer size
        mergeDuplicateVertices(gltfWithExtras);

        encodeImages(gltfWithExtras, callback);
    });
}

function processFile(inputPath, options, callback) {
    readGltf(inputPath, options)
        .then(function(gltf) {
            processJSONWithExtras(gltf, options, function(gltf) {
                writeSources(gltf, function() {
                    callback(gltf);
                });
        });
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

function processJSONToDisk(gltf, outputPath, options) {
    addPipelineExtras(gltf);
    return loadGltfUris(gltf, options)
        .then(function() {
            processJSONWithExtras(gltf, options, function(gltf) {
                return writeFile(gltf, outputPath, options);
            });
        }).catch(function(err) {
            throw err;
        });
}

function processFileToDisk(inputPath, outputPath, options) {
    return readGltf(inputPath, options)
        .then(function(gltf) {
            processJSONWithExtras(gltf, options, function() {
                writeFile(gltf, outputPath, options);
            });
        });
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
