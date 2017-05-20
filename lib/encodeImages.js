'use strict';
var Jimp = require('jimp');
var Promise = require('bluebird');

var jimpGetBuffer = Promise.promisify(Jimp.prototype.getBuffer);

module.exports = encodeImages;

/**
 * Encodes Jimp images in pipeline extras to buffers.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Promise} A promise that resolves to the glTF asset when encoding is complete for all images.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
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
    return Promise.all(promises)
        .then(function() {
            return gltf;
        });
}

function loadImageSource(pipelineExtras, mime) {
    var image = pipelineExtras.jimpImage;
    return jimpGetBuffer.call(image, mime)
        .then(function(imageBuffer) {
            pipelineExtras.source = imageBuffer;
        });
}
