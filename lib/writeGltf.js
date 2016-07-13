'use strict';
var path = require('path');
var Promise = require('bluebird');
var fsExtra = Promise.promisifyAll(require('fs-extra'));

var writeSource = require('./writeSource');
// var outputJson = Promise.promisify(fsExtra.outputJson);

var removePipelineExtras = require('./removePipelineExtras');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = writeGltf;

function writeGltf(gltf, options) {
    var outputPath = options.outputPath;
    var embed = options.embed;
    var embedImage = options.embedImage;
    var createDirectory = options.createDirectory;
    
    if (!defined(outputPath)) {
        throw new DeveloperError('Output path is undefined.');
    }

    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.gltf') {
        throw new DeveloperError('Invalid output path extension.');
    }

    return new Promise(function(resolve) {
        // Create the output directory if specified
        if (createDirectory) {
            outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        }
        var basePath = path.dirname(outputPath);

        var writeSources = [
            writeSource(gltf, basePath, 'buffers', embed, embedImage),
            writeSource(gltf, basePath, 'images', embed, embedImage),
            writeSource(gltf, basePath, 'shaders', embed, embedImage)
        ];

        Promise.all(writeSources)
            .then(function() {
                removePipelineExtras(gltf);
                fsExtra.outputJson(outputPath, gltf);
                resolve();
            });
    });
}
