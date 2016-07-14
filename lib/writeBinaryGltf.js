'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var getBinaryGltf = require('./getBinaryGltf');
var writeSource = require('./writeSource');

fsExtra.outputFile = Promise.promisify(fsExtra.outputFile);

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, options) {
    var outputPath = options.outputPath;
    var embed = options.embed;
    var embedImage = options.embedImage;
    var createDirectory = options.createDirectory;
    if (!defined(outputPath)) {
        throw new DeveloperError('Output path is undefined.');
    }

    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.glb') {
        throw new DeveloperError('Invalid output path extension.');
    }

    // Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
    }
    var basePath = path.dirname(outputPath);

    var writeSources = [
        writeSource(gltf, basePath, 'images', embed, embedImage),
        writeSource(gltf, basePath, 'shaders', embed, embedImage)
    ];

    return Promise.all(writeSources)
        .then(function() {
            var glbData = getBinaryGltf(gltf, embed, embedImage);
            var glb = glbData.glb;
            return fsExtra.outputFile(outputPath, glb);
        });
}
