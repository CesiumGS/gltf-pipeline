'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var Jimp = require('jimp');
var path = require('path');
var Promise = require('bluebird');
var dataUriToBuffer = require('./dataUriToBuffer');
var ForEach = require('./ForEach');
var getImageExtension = require('./getImageExtension');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var isDataUri = Cesium.isDataUri;
var RuntimeError = Cesium.RuntimeError;

module.exports = readResources;

/**
 * Read data uris, buffer views, or files referenced by the glTF into buffers.
 * The buffer data is placed into extras._pipeline.source for the corresponding object.
 * This stage runs before updateVersion and handles both glTF 1.0 and glTF 2.0 assets.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Object with the following properties:
 * @param {String} [options.resourceDirectory] The path to look in when reading external files.
 * @param {Boolean} [options.decodeImages] Whether images should be decoded with Jimp.
 * @param {Boolean} [options.checkTransparency] Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel.
 * @returns {Promise} A promise that resolves to the glTF asset when all resources are read.
 *
 * @private
 */
function readResources(gltf, options) {
    options = defaultValue(options, {});
    options.decodeImages = defaultValue(options.decodeImages, false);
    options.checkTransparency = defaultValue(options.checkTransparency, false);

    var bufferPromises = [];
    var resourcePromises = [];

    ForEach.objectLegacy(gltf.buffers, function(buffer) {
        bufferPromises.push(readBuffer(gltf, buffer, options));
    });

    // Buffers need to be read first because images and shader may resolve to bufferViews
    return Promise.all(bufferPromises)
        .then(function() {
            ForEach.objectLegacy(gltf.shaders, function (shader) {
                resourcePromises.push(readShader(gltf, shader, options));
            });
            ForEach.objectLegacy(gltf.images, function (image) {
                resourcePromises.push(readImage(gltf, image, options));
                ForEach.compressedImage(image, function(compressedImage) {
                    resourcePromises.push(readImage(gltf, compressedImage, options));
                });
            });
            return Promise.all(resourcePromises);
        })
        .then(function() {
            return gltf;
        });
}

function readBuffer(gltf, buffer, options) {
    return readResource(gltf, buffer, options)
        .then(function(data) {
            buffer.extras._pipeline.source = data;
        });
}

function readImage(gltf, image, options) {
    return readResource(gltf, image, options)
        .then(function(data) {
            image.extras._pipeline.source = data;
            if (options.decodeImages) {
                return generateJimpImage(image);
            }
        });
}

function readShader(gltf, shader, options) {
    return readResource(gltf, shader, options)
        .then(function(data) {
            shader.extras._pipeline.source = data.toString();
        });
}

function readResource(gltf, object, options) {
    var uri = object.uri;
    delete object.uri; // Don't hold onto the uri, its contents will be stored in extras._pipeline.source

    // Source already exists if the gltf was converted from a glb
    var source = object.extras._pipeline.source;
    if (defined(source)) {
        return Promise.resolve(source);
    }
    // Handle reading buffer view from 1.0 glb model
    var extensions = object.extensions;
    if (defined(extensions)) {
        var khrBinaryGltf = extensions.KHR_binary_glTF;
        if (defined(khrBinaryGltf)) {
            return Promise.resolve(readBufferView(gltf, khrBinaryGltf.bufferView));
        }
    }
    if (defined(object.bufferView)) {
        return Promise.resolve(readBufferView(gltf, object.bufferView));
    }
    if (isDataUri(uri)) {
        return Promise.resolve(dataUriToBuffer(uri));
    }
    return readFile(object, uri, options);
}

function readBufferView(gltf, bufferViewId) {
    var bufferView = gltf.bufferViews[bufferViewId];
    var buffer = gltf.buffers[bufferView.buffer];
    var source = buffer.extras._pipeline.source;
    return source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
}

function readFile(object, uri, options) {
    var resourceDirectory = options.resourceDirectory;
    var relativePath;
    var absolutePath;

    if (path.isAbsolute(uri)) {
        relativePath = path.basename(uri);
        absolutePath = uri;
    } else {
        if (!defined(resourceDirectory)) {
            throw new RuntimeError('glTF model references external files but no resourceDirectory is supplied');
        }
        relativePath = uri;
        absolutePath = path.join(resourceDirectory, uri);
    }

    object.extras._pipeline.absolutePath = absolutePath;
    object.extras._pipeline.relativePath = relativePath;
    return fsExtra.readFile(absolutePath);
}

var supportedExtensions = /\.(jpg|jpeg|bmp|png)$/i;

function generateJimpImage(image, options) {
    var pipelineExtras = image.extras._pipeline;
    var extension = getImageExtension(pipelineExtras.source);
    if (!supportedExtensions.test(extension)) {
        return;
    }

    // Workaround since Jimp (via pngjs) throws error when reading 1x1 png: https://github.com/oliver-moran/jimp/issues/181
    var buffer = pipelineExtras.source;
    if (extension === '.png') {
        var width = buffer.readUInt32BE(16);
        var height = buffer.readUInt32BE(20);
        if (width === 1 && height === 1) {
            pipelineExtras.jimpImage = new Jimp(1, 1, 0xFFFFFFFF);
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = false;
            return;
        }
    }
    return Jimp.read(pipelineExtras.source)
        .then(function(jimpImage) {
            pipelineExtras.jimpImage = jimpImage;
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = options.checkTransparency ? isTransparent(jimpImage) : false;
        });
}

function isTransparent(jimpImage) {
    var width = jimpImage.bitmap.width;
    var height = jimpImage.bitmap.height;
    for (var x = 0; x < width; ++x) {
        for (var y = 0; y < height; ++y) {
            var color = jimpImage.getPixelColor(x, y);
            color = color & 0x000000FF;
            if (color < 255) {
                return true;
            }
        }
    }
    return false;
}
