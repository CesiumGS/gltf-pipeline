'use strict';
var fs = require('fs');
var addDefaults = require('./addDefaults');
var removeUnusedImages = require('./removeUnusedImages');
var removeUnusedSamplers = require('./removeUnusedSamplers');
var removeUnusedShaders = require('./removeUnusedShaders');
var removeUnusedTechniques = require('./removeUnusedTechniques');
var removeUnusedPrograms = require('./removeUnusedPrograms');
var removeUnusedBuffers = require('./removeUnusedBuffers');
var removeUnusedBufferViews = require('./removeUnusedBufferViews');
var removeUnusedMaterials = require('./removeUnusedMaterials');
var removeUnusedSkins = require('./removeUnusedSkins');
var removeUnusedCameras = require('./removeUnusedCameras');
var removeUnusedTextures = require('./removeUnusedTextures');
var removeUnusedMeshes = require('./removeUnusedMeshes');
var removeUnusedNodes = require('./removeUnusedNodes');
var removeUnusedAccessors = require('./removeUnusedAccessors');
var removeUnused = require('./removeUnused');
var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var convertDagToTree = require('./convertDagToTree');
var combineMeshes = require('./combineMeshes');
var combinePrimitives = require('./combinePrimitives');
var removeUnusedVertices = require('./removeUnusedVertices');
var OptimizationStatistics = require('./OptimizationStatistics');
var writeGltf = require('./writeGltf');
var writeBinaryGltf = require('./writeBinaryGltf');
var readGltf = require('./readGltf');
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;

module.exports = {
    processJSON : processJSON,
    processFile : processFile,
    processJSONToDisk : processJSONToDisk,
    processFileToDisk : processFileToDisk
};

function processJSON(gltfWithExtras, options, callback) {
    var stats = new OptimizationStatistics();

    addDefaults(gltfWithExtras, stats);

    removeUnused(gltfWithExtras, stats);
    printStats(stats);

    convertDagToTree(gltfWithExtras);

    removeUnusedVertices(gltfWithExtras);

    combineMeshes(gltfWithExtras);
    combinePrimitives(gltfWithExtras);

    //Run removeUnused stage again after all pipeline stages have been run to remove objects that become unused
    removeUnused(gltfWithExtras);

    callback(gltfWithExtras);
}

function processFile(inputPath, options, callback) {
    readGltf(inputPath, function(gltf) {
        processJSON(gltf, options, function(gltf) {
            callback(gltf);
        });
    });
}

function processJSONToDisk(gltfWithExtras, outputPath, options, callback) {// isBinary, isEmbedded) {
    processJSON(gltfWithExtras, function(gltfWithExtras) {
        var isBinary = defaultValue(options.isBinary, false);
        var isEmbedded = defaultValue(options.isEmbedded, false);
        if (isBinary) {
            writeBinaryGltf(gltfWithExtras, outputPath, true, callback);
        } else {
            writeGltf(gltfWithExtras, outputPath, isEmbedded, true, callback);
        }
    });
}

function processFileToDisk(inputPath, outputPath, options, callback) {//isBinary, isEmbedded) {
    processFile(inputPath, options, function(gltf) {
        var isBinary = defaultValue(options.isBinary, false);
        var isEmbedded = defaultValue(options.isEmbedded, false);
        if (isBinary) {
            writeBinaryGltf(gltf, outputPath, true, callback);
        } else {
            writeGltf(gltf, outputPath, isEmbedded, true, callback);
        }
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
