#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var addDefaults = require('../').addDefaults;
var removeUnusedImages = require('../').removeUnusedImages;
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

    var gltf = JSON.parse(data);
    var stats = new OptimizationStatistics();

    // TODO: custom pipeline based on arguments / config
    removeUnusedImages(gltf, stats);
    addDefaults(gltf, stats);

    stats.print();

    var outputPath = argv.o;
    if (!defined(outputPath)) {
        // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
        var fileExtension = path.extname(gltfPath);
        var filename = path.basename(gltfPath, fileExtension);
        var filePath = path.dirname(gltfPath);
        outputPath = path.join(filePath, filename + '-optimized' + fileExtension);
    }

    fs.writeFile(outputPath, JSON.stringify(gltf, undefined, 2), function (err) {
        if (err) {
            throw err;
        }
    });        
});
