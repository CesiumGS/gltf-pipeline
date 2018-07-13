'use strict';
var Cesium = require('cesium');
var Jimp = require('jimp');
var Promise = require('bluebird');
var dataUriToBuffer = require('data-uri-to-buffer');
var fsExtra = require('fs-extra');
var path = require('path');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;

var isDataUri = require('./isDataUri');

module.exports = loadGltfUris;

/**
 * Load uris in the glTF into buffers.
 * The buffer data is placed into extras._pipeline.source for the corresponding object.
 * glTF must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options Options for loading uris.
 * @param {String} options.basePath The path to look in when loading external files.
 * @returns {Promise} A promise that resolves to the glTF asset when all uris are loaded.
 *
 * @see addPipelineExtras
 */
function loadGltfUris(gltf, options) {
    options = defaultValue(options, {});
    var basePath = options.basePath;
    var loadURIs = [
        loadURI(gltf.buffers, 'buffers', basePath),
        loadURI(gltf.images, 'images', basePath),
        loadURI(gltf.shaders, 'shaders', basePath)
    ];

    // Read sources for compressed textures
    var images = gltf.images;
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
                var compressedImages = image.extras.compressedImage3DTiles;
                loadURIs.push(loadURI(compressedImages, 'images', basePath));
            }
        }
    }

    return Promise.all(loadURIs)
        .then(function() {
            gltf.extras._pipeline.jimpScratch = new Jimp(1, 1);
            return gltf;
        });
}

function loadURI(objects, name, basePath) {
    //Iterate through each object and get a promise to load its uri
    var promises = [];
    if (defined(objects)) {
        for (var id in objects) {
            if (objects.hasOwnProperty(id)) {
                var object = objects[id];
                object.extras = defaultValue(object.extras, {});
                object.extras._pipeline = defaultValue(object.extras._pipeline, {});
                if (defined(object.extras._pipeline.source) && !defined(object.uri)) {
                    object.uri = 'data:,';
                }
                var uri = object.uri;
                //Load the uri into the extras object based on the uri type
                if (isDataUri(uri)) {
                    if (!defined(object.extras._pipeline.source)) {
                        var buffer = dataUriToBuffer(uri);
                        if (name === 'shaders') {
                            object.extras._pipeline.source = buffer.toString();
                        } else {
                            object.extras._pipeline.source = buffer;
                        }
                    }
                    if (!defined(object.extras._pipeline.extension)) {
                        switch (name) {
                            case 'buffers':
                                object.extras._pipeline.extension = '.bin';
                                break;
                            case 'images':
                                object.extras._pipeline.extension = getImageDataUriFormat(uri);
                                break;
                            case 'shaders':
                                object.extras._pipeline.extension = '.glsl';
                                break;
                        }
                    }
                    if (name === 'images') {
                        promises.push(generateJimpImage(object));
                    }
                } else {
                    var uriPath = decodeURI(uri);
                    if (!path.isAbsolute(uriPath)) {
                        if (!defined(basePath)) {
                            throw new DeveloperError('glTF model references external files but no basePath is supplied');
                        }
                        uriPath = path.join(basePath, uriPath);
                    }
                    promises.push(readFromFile(object, name, uriPath));
                }
            }
        }
    }
    return Promise.all(promises);
}

/**
 * Return the extension of the data uri.
 *
 * @private
 * @param {String} uri
 * @returns {String}
 */
function getImageDataUriFormat(uri) {
    var extension = uri.match('\/([^)]+)\;');
    if (extension === null) {
        throw new DeveloperError('No available image file extension');
    }
    return '.' + extension[1];
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

function readFromFile(object, name, uriPath) {
    return fsExtra.readFile(uriPath)
        .then(function(data) {
            if (name === 'shaders') {
                object.extras._pipeline.source = data.toString();
            } else {
                object.extras._pipeline.source = data;
            }
            object.extras._pipeline.extension = path.extname(uriPath).toLowerCase();
            object.extras._pipeline.absolutePath = path.resolve(uriPath);
            if (name === 'images') {
                return generateJimpImage(object);
            }
        });
}

var supportedExtensions = /\.(jpg|jpeg|bmp|png)$/i;
/**
 * Generate a jimp image for png, jpeg, or bmp.
 *
 * @private
 * @param {Object} object
 * @returns {Promise}
 */
function generateJimpImage(object) {
    var pipelineExtras = object.extras._pipeline;
    var ext = pipelineExtras.extension;
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
