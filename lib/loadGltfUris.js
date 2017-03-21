'use strict';
var Cesium = require('cesium');
var Jimp = require('jimp');
var Promise = require('bluebird');
var dataUriToBuffer = require('data-uri-to-buffer');
var fs = require('fs');
var path = require('path');
var ForEach = require('./ForEach');
var isDataUri = require('./isDataUri');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;

var fsReadFile = Promise.promisify(fs.readFile);

module.exports = loadGltfUris;

/**
 * Load uris in the glTF into buffers.
 * The buffer data is placed into extras._pipeline.source for the corresponding object.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Options for loading uris.
 * @param {String} [options.basePath] The path to look in when loading external files.
 * @returns {Promise} A promise that resolves to the glTF asset when all uris are loaded.
 */
function loadGltfUris(gltf, options) {
    options = defaultValue(options, {});
    var basePath = defaultValue(options.basePath, '');
    // Buffers need to be loaded first because images and shader may resolve to bufferViews
    return loadURIs(gltf, gltf.buffers, 'buffers', basePath)
        .then(function() {
            var loadPromises = [
                loadURIs(gltf, gltf.images, 'images', basePath),
                loadURIs(gltf, gltf.shaders, 'shaders', basePath)
            ];

            // Read sources for compressed textures
            ForEach.image(function (image) {
                if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
                    var compressedImages = image.extras.compressedImage3DTiles;
                    loadPromises.push(loadURIs(gltf, compressedImages, 'images', basePath));
                }
            });

            return Promise.all(loadPromises)
                .then(function () {
                    gltf.extras = defaultValue(gltf.extras, {});
                    gltf.extras._pipeline = defaultValue(gltf.extras._pipeline, {
                        deleteExtras: true
                    });
                    gltf.extras._pipeline.jimpScratch = new Jimp(1, 1);
                    return gltf;
                });
        });
}

function loadURIs(gltf, objects, name, basePath) {
    if (defined(objects)) {
        return Promise.each(objects, function (object) {
            return loadURI(gltf, object, name, basePath);
        });
    }
    return Promise.resolve();
}

function loadURI(gltf, object, name, basePath) {
    var promises = [];
    object.extras = defaultValue(object.extras, {});
    object.extras._pipeline = defaultValue(object.extras._pipeline, {});
    if (defined(object.extras._pipeline.source) && !defined(object.uri)) {
        object.uri = 'data:,';
    }
    var uri = object.uri;
    //Load the uri into the extras object based on the uri type
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    if (defined(object.bufferView)) {
        var bufferView = bufferViews[object.bufferView];
        var bufferId = bufferView.buffer;
        var buffer = buffers[bufferId];
        var source = buffer.extras._pipeline.source;
        object.extras._pipeline.source = source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        if (!defined(object.extras._pipeline.extension)) {
            if (name === 'images') {
                object.extras._pipeline.extension = getBinaryImageFormat(object.extras._pipeline.source.slice(0, 2));
            }
        }
    } else if (isDataUri(uri)) {
        if (!defined(object.extras._pipeline.source)) {
            var dataBuffer = dataUriToBuffer(uri);
            if (name === 'shaders') {
                object.extras._pipeline.source = dataBuffer.toString();
            } else {
                object.extras._pipeline.source = dataBuffer;
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
        var uriPath = uri;
        if (!path.isAbsolute(uriPath)) {
            if (!defined(basePath)) {
                throw new DeveloperError('glTF model references external files but no basePath is supplied');
            }
            uriPath = path.join(basePath, uriPath);
        }
        promises.push(readFromFile(object, name, uriPath));
    }
    return Promise.all(promises);
}

function bufferEqual(first, second) {
    for (var i = 0; i < first.length && i < second.length; i++) {
        if (first[i] !== second[i]) {
            return false;
        }
    }
    return true;
}

function getBinaryImageFormat(header) {
    if (bufferEqual(header, new Uint8Array([66, 77]))) { //.bmp: 42 4D
        return '.bmp';
    }
    else if (bufferEqual(header, new Uint8Array([71, 73]))) { //.gif: 47 49
        return '.gif';
    }
    else if (bufferEqual(header, new Uint8Array([255, 216]))) { //.jpg: ff d8
        return '.jpg';
    }
    else if (bufferEqual(header, new Uint8Array([137, 80]))) { //.png: 89 50
        return '.png';
    }
    else if (bufferEqual(header, new Uint8Array([171, 75]))) { //.ktx ab 4b
        return '.ktx';
    }
    else if (bufferEqual(header, new Uint8Array([72, 120]))) { //.crn 48 78
        return '.crn';
    }
    else {
        throw new DeveloperError('Binary image does not have valid header');
    }
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
    return fsReadFile(uriPath)
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

var jimpSupportedExtensions = ['.png', '.jpg', '.jpeg', '.bmp'];

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
    if (jimpSupportedExtensions.indexOf(ext) === -1) {
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
        });
}
