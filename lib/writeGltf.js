'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var removePipelineExtras = require('./removePipelineExtras');
var writeSource = require('./writeSource');

fsExtra.outputJsonAsync = Promise.promisify(fsExtra.outputJson);

module.exports = writeGltf;

/**
 * Writes the glTF asset to a file.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options Defines custom behavior for writing.
 * @param {String} options.outputPath The file path where the glTF should be written.
 * @param {Boolean} options.embed Flag to embed shader uris.
 * @param {Boolean} options.embedImage Flag to embed image uris.
 * @param {Boolean} options.createDirectory If true, a directory named 'output' will be created at options.outputPath and the output will be written there.
 * @returns {Promise} A promise resolving when the write operation completes.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
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
            return fsExtra.outputJsonAsync(outputPath, gltf);
        });
}
