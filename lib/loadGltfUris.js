'use strict';
var Cesium = require('cesium');
var Jimp = require('jimp');
var Promise = require('bluebird');
var dataUriToBuffer = require('data-uri-to-buffer');
var fs = require('fs');
var path = require('path');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;

var isDataUri = require('./isDataUri');

var fsReadFile = Promise.promisify(fs.readFile);

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
        loadURI(gltf, basePath, 'buffers'),
        loadURI(gltf, basePath, 'images'),
        loadURI(gltf, basePath, 'shaders')
    ];
    return Promise.all(loadURIs)
        .then(function() {
            gltf.extras._pipeline.jimpScratch = new Jimp(1, 1);
            return gltf;
        });
}

function loadURI(gltf, basePath, name) {
    var objects = gltf[name];
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
                        object.extras._pipeline.source = dataUriToBuffer(uri);
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
                    promises.push(readExternalFile(object, name, uriPath));
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

function readExternalFile(object, name, uriPath) {
    return fsReadFile(uriPath)
        .then(function(data) {
            object.extras._pipeline.source = data;
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
    return Jimp.read(pipelineExtras.source)
        .then(function (image) {
            pipelineExtras.jimpImage = image;
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = isTransparent(image);
        });
}
