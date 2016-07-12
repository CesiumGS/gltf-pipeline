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

module.exports = loadGltfUris;

function loadGltfUris(gltf, options) {
    return new Promise(function(resolve, reject) {
        var basePath = options.basePath;
        var loadURIs = [
            loadURI(gltf, basePath, 'buffers'),
            loadURI(gltf, basePath, 'images'),
            loadURI(gltf, basePath, 'shaders')
        ];
        Promise.all(loadURIs).then(function() {
            gltf.extras._pipeline.jimpScratch = new Jimp(1, 1, function(err) {
                if (defined(err)) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }).catch(function(err) {
            reject(err);
        });
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
                var uri = object.uri;
                object.extras = defaultValue(object.extras, {});
                object.extras._pipeline = defaultValue(object.extras._pipeline, {});
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
                    promises.push(readFromFile(object, name, uriPath));
                }
            }
        }
    }
    return Promise.all(promises);
}

/**
 * Return the extension of the data uri
 * @param {string} uri
 * @returns {string}
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
    return new Promise(function(resolve, reject) {
        fs.readFile(uriPath, function (err, data) {
            if (defined(err)) {
                reject(err);
            } else {
                object.extras._pipeline.source = data;
                object.extras._pipeline.extension = path.extname(uriPath);
                if (name === 'images') {
                    generateJimpImage(object).then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    });
                } else {
                    resolve();
                }
            }
        });
    });
}

/**
 * Generate a jimp image for png, jpeg, or bmp
 *
 * @param {Object} object
 * @returns {Promise}
 */
function generateJimpImage(object) {
    var pipelineExtras = object.extras._pipeline;
    if (pipelineExtras.extension === '.gif') {
        throw new DeveloperError('gltf pipeline image processing does not currently support gifs.');
    }
    return new Promise(function(resolve, reject) {
        Jimp.read(pipelineExtras.source, function (err, image) {
            if (defined(err)) {
                reject(err);
            }
            pipelineExtras.jimpImage = image;
            pipelineExtras.imageChanged = false;
            pipelineExtras.transparent = isTransparent(image);
            resolve();
        });
    });
}
