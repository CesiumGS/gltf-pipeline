'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var getBinaryGltf = require('./getBinaryGltf');
var writeSource = require('./writeSource');
var outputFile = Promise.promisify(fsExtra.outputFile);
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, options, callback) {
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

    return new Promise(function(resolve) {
        // Create the output directory if specified
        if (createDirectory) {
            outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        }
        var basePath = path.dirname(outputPath);

        var writeSources = [
            writeSource(gltf, basePath, 'images', embed, embedImage),
            writeSource(gltf, basePath, 'shaders', embed, embedImage)
        ];

        Promise.all(writeSources)
            .then(function() {
                var glb = getBinaryGltf(gltf, embed, embedImage, function(header, scene, body) {
                    if (callback) {
                        callback(undefined, header, scene, body);
                    }
                });
                outputFile(outputPath, glb);
                resolve();
        });
    });
}
