'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var compressTexture = require('./compressTexture');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = compressTextures;

var defaultImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='; // 1x1 white png

/**
 * Compress textures in the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object|Object[]} options Options defining compressed texture setting. If an array of options is given, the textures will be compressed in multiple formats.
 * @param {String} options.format The compressed texture format. Supported formats are 'pvrtc1', 'pvrtc2', 'etc1', 'etc2', 'astc', 'dxt1', 'dxt3', 'dxt5', 'crunch-dxt1', 'crunch-dxt5'.
 * @param {Number} [options.quality=5] A value between 0 and 10 specifying the quality of the compressed textures. Higher values produce better quality compression but take longer to compute. Different texture formats and compress tools may treat this value differently.
 * @param {Number} [options.bitrate=2.0] The bits-per-pixel when using the pvrtc or astc formats. For pvrtc supported values are 2.0 and 4.0.
 * @param {String} [options.blockSize='8x8'] The block size for astc compression. Smaller block sizes result in higher bitrates. This value is ignored if options.bitrate is also set. Supported block sizes are '4x4', '5x4', '5x5', '6x5', '6x6', '8x5', '8x6', '8x8', '10x5', '10x6', '10x8', '10x10', '12x10', '12x12'.
 * @param {Boolean} [options.alphaBit=false] Store a single bit for alpha. Only supported for etc2.
 * @returns {Promise} A promise that resolves to the glTF asset with embedded compressed textures.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function compressTextures(gltf, options) {
    if (!defined(gltf)) {
        throw new DeveloperError('gltf must be defined');
    }

    if (!defined(options)) {
        throw new DeveloperError('options must be defined');
    }

    var optionsArray = Array.isArray(options) ? options : [options];

    if (optionsArray.length === 0) {
        throw new DeveloperError('options must include at least one compressed texture format');
    }

    var promises = [];
    var images = gltf.images;
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            var pipelineExtras = image.extras._pipeline;
            var compressedImages = {};
            var length = optionsArray.length;
            for (var i = 0; i < length; ++i) {
                var compressionOptions = optionsArray[i];
                var compressedType = compressionOptions.format;
                if (compressedType.indexOf('crunch') >= 0) {
                    // crunch-dxt1, crunch-dxt5 require the s3tc extension and a crunch decoder
                    compressedType = 'crunch';
                } else if (compressedType.indexOf('dxt') >= 0) {
                    // dxt1, dxt3, dxt5 all require the s3tc extension
                    compressedType = 's3tc';
                }
                var compressedImage = {
                    uri : undefined,
                    extras : {
                        _pipeline : {
                            source : undefined,
                            extension : undefined,
                            name : imageId + '-' + compressedType
                        }
                    }
                };
                compressedImages[compressedType] = compressedImage;
                promises.push(compressTexture(gltf, imageId, compressionOptions)
                    .then(replaceImage(compressedImage)));
            }

            image.extras.compressedImage3DTiles = compressedImages;

            // Set the default image to a 1x1 white png
            image.uri = defaultImageUri;
            pipelineExtras.source = Buffer.from(defaultImageUri.slice(22), 'base64');
            pipelineExtras.transparent = false;
            pipelineExtras.extension = '.png';
        }
    }

    // Edit samplers to disallow mip-mapping
    var samplers = gltf.samplers;
    for (var samplerId in samplers) {
        if (samplers.hasOwnProperty(samplerId)) {
            var sampler = samplers[samplerId];
            if (sampler.minFilter !== WebGLConstants.NEAREST && sampler.minFilter !== WebGLConstants.LINEAR) {
                sampler.minFilter = WebGLConstants.LINEAR;
            }
        }
    }

    return Promise.all(promises);
}

function replaceImage(image) {
    return function(compressed) {
        var pipelineExtras = image.extras._pipeline;
        pipelineExtras.source = compressed.buffer;
        pipelineExtras.extension = compressed.extension;
    };
}
