'use strict';
var fs = require('fs');
var path = require('path');
var addDefaults = require('./addDefaults');
var removeUnusedImages = require('../').removeUnusedImages;
var removeUnusedSamplers = require('../').removeUnusedSamplers;
var removeUnusedShaders = require('../').removeUnusedShaders;
var removeUnusedTechniques = require('../').removeUnusedTechniques;
var removeUnusedPrograms = require('../').removeUnusedPrograms;
var removeUnusedBuffers = require('../').removeUnusedBuffers;
var removeUnusedBufferViews = require('../').removeUnusedBufferViews;
var removeUnusedMaterials = require('../').removeUnusedMaterials;
var removeUnusedSkins = require('../').removeUnusedSkins;
var removeUnusedCameras = require('../').removeUnusedCameras;
var removeUnusedTextures = require('../').removeUnusedTextures;
var removeUnusedMeshes = require('../').removeUnusedMeshes;
var removeUnusedNodes = require('../').removeUnusedNodes;
var removeUnusedAccessors = require('../').removeUnusedAccessors;
var removeUnused = require('./removeUnused');
var loadGltfUris = require('./loadGltfUris');
var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var convertDagToTree = require('./convertDagToTree');
var combineMeshes = require('./combineMeshes');
var combinePrimitives = require('./combinePrimitives');
var removeUnusedVertices = require('./removeUnusedVertices');
var OptimizationStatistics = require('./OptimizationStatistics');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;


module.exports = gltfPipeline;

function gltfPipeline(options, callback) {
    var gltfPath = options.inputPath;
    
    if (!defined(gltfPath)) {
        throw new DeveloperError('Input path is undefined');
    }
    
    var fileExtension = path.extname(gltfPath);
    var fileName = path.basename(gltfPath, fileExtension);
    var filePath = path.dirname(gltfPath);

    fs.readFile(gltfPath, function (err, data) {
        if (err) {
            throw err;
        }

        var gltf;
        if (fileExtension === '.glb') {
            gltf = parseBinaryGltf(data);
        }
        else if (fileExtension === '.gltf') {
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
        }
        else {
            throw new Error('Invalid glTF file.');
        }

        var stats = new OptimizationStatistics();

        addDefaults(gltf, stats);

        removeUnused(gltf, stats);
        printStats(stats);

        convertDagToTree(gltf);

        gltf = loadGltfUris(gltf, filePath, function (err) {
            if (err) {
                throw err;
            }

            combineMeshes(gltf);
            combinePrimitives(gltf);

            removeUnusedVertices(gltf);

            //Run removeUnused stage again after all pipeline stages have been run to remove objects that become unused
            removeUnused(gltf);

            callback(gltf);
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
