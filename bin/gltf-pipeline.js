#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var addDefaults = require('../').addDefaults;
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
var removeUnused = require('../').removeUnused;
var loadGltfUris = require('../').loadGltfUris;
var writeGltf = require('../').writeGltf;
var parseBinaryGltf = require('../').parseBinaryGltf;
var OptimizationStatistics = require('../').OptimizationStatistics;
var Cesium = require('cesium');
var defined = Cesium.defined;

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
	var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.gltf or path-to.bgltf] [OPTIONS]\n' +
        '  -o=PATH  Write optimized glTF to the specified file.\n';
    process.stdout.write(help);
    return;
}

var gltfPath = argv._[0];

fs.readFile(gltfPath, function (err, data) {
    if (err) {
        throw err;
    }

    var fileExtension = path.extname(gltfPath);
    var fileName = path.basename(gltfPath, fileExtension);
    var filePath = path.dirname(gltfPath);

    var gltf;
    if (fileExtension === '.glb') {
        gltf = parseBinaryGltf(data);
    }
    else if (fileExtension === '.gltf') {
        gltf = JSON.parse(data);
    }
    else {
        throw new Error('Invalid glTF file.');
    }
    
    var stats = new OptimizationStatistics();

    addDefaults(gltf, stats);

    // TODO: custom pipeline based on arguments / config
    removeUnused(gltf, stats);
    printStats(stats);

    gltf = loadGltfUris(gltf, filePath, function(err) {
        if (err) {
            throw err;
        }
        
        var outputPath = argv.o;
        if (!defined(outputPath)) {
            // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
            outputPath = path.join(filePath, fileName + '-optimized' + fileExtension);
        }

        var isEmbedded = false;
        writeGltf(gltf, outputPath, isEmbedded, true);
    });
});

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
