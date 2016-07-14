'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var removePipelineExtras = require('./removePipelineExtras');
var writeSource = require('./writeSource');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

fsExtra.outputJson = Promise.promisify(fsExtra.outputJson);

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

    // Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        fsExtra.ensureDirSync(path.dirname(outputPath));
    }
    var basePath = path.dirname(outputPath);

    var writeSources = [
        writeSource(gltf, basePath, 'buffers', embed, embedImage),
        writeSource(gltf, basePath, 'images', embed, embedImage),
        writeSource(gltf, basePath, 'shaders', embed, embedImage)
    ];
    
    
    return Promise.all(writeSources)
        .then(function() {
            removePipelineExtras(gltf);
            return fsExtra.outputJson(outputPath, gltf);
        });
}
