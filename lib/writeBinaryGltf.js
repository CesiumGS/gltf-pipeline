'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var ForEach = require('./ForEach');
var getBinaryGltf = require('./getBinaryGltf');
var writeSource = require('./writeSource');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

fsExtra.outputFileAsync = Promise.promisify(fsExtra.outputFile);

module.exports = writeBinaryGltf;

/**
 * Writes a glTF asset to a file as binary glTF.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options Defines custom behavior for writing.
 * @param {String} options.outputPath The file path where the binary glTF should be written.
 * @param {Boolean} options.embed Flag to embed shader uris.
 * @param {Boolean} options.embedImage Flag to embed image uris.
 * @param {Boolean} options.createDirectory If true, a directory named 'output' will be created at options.outputPath and the output will be written there.
 * @returns {Promise} A promise resolving when the write operation completes.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function writeBinaryGltf(gltf, options) {
    var outputPath = options.outputPath;
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
        writeSource(gltf.images, 'images', basePath, options),
        writeSource(gltf.shaders, 'shaders', basePath, options)
    ];

    // Write sources for compressed textures
    ForEach.image(gltf, function(image) {
        if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
            var compressedImages = image.extras.compressedImage3DTiles;
            writeSources.push(writeSource(compressedImages, 'images', basePath, options));
        }
    });

    return Promise.all(writeSources)
        .then(function() {
            var glbData = getBinaryGltf(gltf, options);
            var glb = glbData.glb;
            return fsExtra.outputFileAsync(outputPath, glb);
        });
}
