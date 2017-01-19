'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var compressTexture = require('./compressTexture');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = compressTexturesMultipleFormats;

var defaultImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='; // 1x1 white png

/**
 * Compress textures in the glTF model into a variety of texture formats.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object[]} optionsArray An array of options defining compressed texture setting for each texture format. See {@link compressTextures}.
 * @returns {Promise} A promise that resolves to the glTF asset with embedded compressed textures.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function compressTexturesMultipleFormats(gltf, optionsArray) {
    if (!defined(optionsArray) || optionsArray.length === 0) {
        throw new DeveloperError('optionsArray.length must be greater than 0.');
    }

    var promises = [];
    var images = gltf.images;
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            var pipelineExtras = image.extras._pipeline;
            var compressImageIds = {};
            var length = optionsArray.length;
            for (var i = 0; i < length; ++i) {
                var options = optionsArray[i];
                var compressedType = options.format;
                if (compressedType.indexOf('dxt') >= 0) {
                    // dxt1, dxt3, dxt5, crunch-dxt1, crunch-dxt5 all require the s3tc extension
                    compressedType = 's3tc';
                }
                var compressedImageId = imageId + '_' + compressedType;
                compressImageIds[compressedType] = compressedImageId;
                var compressedImage = {
                    uri : undefined,
                    extras : {
                        _pipeline : {
                            source : undefined,
                            extension : undefined
                        }
                    }
                };
                images[compressedImageId] = compressedImage;
                promises.push(compressTexture(gltf, imageId, options)
                    .then(replaceImage(compressedImage)));
            }

            image.extras.compressedImages3DTiles = compressImageIds;
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
