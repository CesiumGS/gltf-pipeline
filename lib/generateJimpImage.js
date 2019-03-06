'use strict';
var Jimp = require('jimp');
var Promise = require('bluebird');
const ForEach = require('./ForEach');

module.exports = generateJimpImage;

var supportedExtensions = /\.(jpg|jpeg|bmp|png)$/i;
/**
 * Generate a jimp image for png, jpeg, or bmp.
 *
 * @private
 * @param {Object} object
 * @returns {Promise}
 */
function generateJimpImage(gltf, options) {
    // Buffers need to be read first because images and shader may resolve to bufferViews
    const resourcePromises = [];

    ForEach.image(gltf, function (image) {
        resourcePromises.push(_generateJimpImage(gltf, image, options));
        // ForEach.compressedImage(image, function(compressedImage) {
        //     resourcePromises.push(_generateJimpImage(gltf, compressedImage, options));
        // });
    });
    return Promise.all(resourcePromises)
        .then(function() {
            return gltf;
        });
}
function _generateJimpImage(gltf, object, options) {
    var pipelineExtras = object.extras._pipeline;
    var ext = pipelineExtras.extension;
    ext = object.mimeType.replace("image/", ".");
    if (!supportedExtensions.test(ext)) {
        return Promise.resolve();
    }

    // Workaround since Jimp (via pngjs) throws error when loading 1x1 png: https://github.com/oliver-moran/jimp/issues/181
    var buffer = pipelineExtras.source;
    if (ext === '.png') {
        var width = buffer.readUInt32BE(16);
        var height = buffer.readUInt32BE(20);
        if (width === 1 && height === 1) {
            pipelineExtras.jimpImage = new Jimp(1, 1, 0xFFFFFFFF);
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = false;
            return Promise.resolve();
        }
    }
    return Jimp.read(pipelineExtras.source)
        .then(function (image) {
            pipelineExtras.jimpImage = image;
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = isTransparent(image);
        })
        .catch(function() {
            // Empty function to catch and ignore errors
        });
}

function isTransparent(image) {
    var width = image.bitmap.width;
    var height = image.bitmap.height;
    for (var x = 0; x < width; ++x) {
        for (var y = 0; y < height; ++y) {
            var color = image.getPixelColor(x, y);
            color = color & 0x000000FF;
            if (color < 255) {
                return true;
            }
        }
    }
    return false;
}