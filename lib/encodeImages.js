'use strict';
var Cesium = require('cesium');
var Jimp = require('jimp');
var Promise = require('bluebird');

var defined = Cesium.defined;

module.exports = encodeImages;

/**
 * Encodes Jimp images in pipeline extras to buffers.
 * 
 * @param {Object} gltf
 * @returns {Promise} A promise that resolves when encoding is complete for all images.
 */
function encodeImages(gltf) {
    var images = gltf.images;
    var promises = [];
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            var pipelineExtras = image.extras._pipeline;
            if (pipelineExtras.imageChanged) {
                // re-encode the jimp image here to a buffer that can be put in source
                var mime;
                switch (pipelineExtras.extension) {
                    case '.png':
                        mime = Jimp.MIME_PNG;
                        break;
                    case '.jpeg':
                        mime = Jimp.MIME_JPEG;
                        break;
                    case '.jpg':
                        mime = Jimp.MIME_JPEG;
                        break;
                    case '.bmp':
                        mime = Jimp.MIME_BMP;
                        break;
                }
                promises.push(loadImageSource(pipelineExtras, mime));
            }
        }
    }
    return Promise.all(promises);
}

function loadImageSource(pipelineExtras, mime) {
    var image = pipelineExtras.jimpImage;
    if (!defined(image.getBufferAsync)) {
        image.getBufferAsync = Promise.promisify(image.getBuffer);
    }
    return image.getBufferAsync(mime)
        .then(function(imageBuffer) {
            pipelineExtras.source = imageBuffer;
        });
}
