'use strict';
var Cesium = require('cesium');
var Jimp = require('jimp');
var Promise = require('bluebird');
var imagemin = require('imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');
var imageminPngquant = require('imagemin-pngquant');

var defined = Cesium.defined;

Jimp.prototype.getBufferAsync = Promise.promisify(Jimp.prototype.getBuffer);

module.exports = encodeImages;

/**
 * Encodes Jimp images in pipeline extras to buffers.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Boolean} [options.minifyImages=false] Run images through imagemin to reduce their size.
 * @returns {Promise} A promise that resolves to the glTF asset when encoding is complete for all images.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function encodeImages(gltf, options) {
    var images = gltf.images;
    var promises = [];
    var minifyImages = false;
    if (defined(options)) {
        minifyImages = options.minifyImages;
    }
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            var pipelineExtras = image.extras._pipeline;
            if (pipelineExtras.imageChanged || minifyImages) {
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
                promises.push(loadImageSource(pipelineExtras, mime, minifyImages));
            }
        }
    }
    return Promise.all(promises)
        .then(function() {
            return gltf;
        });
}

function loadImageSource(pipelineExtras, mime, minifyImages) {
    var image = pipelineExtras.jimpImage;
    return image.getBufferAsync(mime)
        .then(function(imageBuffer) {
            if (minifyImages) {
                return imagemin.buffer(imageBuffer, {
                    plugins : [
                        imageminMozjpeg(),
                        imageminPngquant( {quality: '65-80'} )
                    ]
                });
            }
            return imageBuffer;
        })
        .then(function(imageBuffer) {
            pipelineExtras.source = imageBuffer;
        });
}
