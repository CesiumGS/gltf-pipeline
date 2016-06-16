'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var isDataUri = require('./isDataUri');
var dataUriToBuffer = require('data-uri-to-buffer');
var async = require('async');
var Jimp = require('jimp');

module.exports = loadGltfUris;

function loadGltfUris(gltf, basePath, callback, imageProcess) {
    // if this will be an image processing pipeline, add a scratch Jimp image to gltf.extras._pipeline
    var wrappedCallback = callback;

    if (imageProcess) {
        wrappedCallback = function(err, gltf) {
            gltf.extras._pipeline.jimpScratch = new Jimp(1, 1, function(jimpErr, image) {
                if (jimpErr) {
                    throw jimpErr;
                }
                gltf.extras._pipeline.jimpScratch = image;
                callback(err, gltf);
            });
        };
    }

    async.each(['buffers', 'images', 'shaders'], function(name, asyncCallback) {
        loadURI(gltf, basePath, name, asyncCallback, imageProcess);
    }, function(err) {
        wrappedCallback(err, gltf);
    });
}

function loadURI(gltf, basePath, name, callback, imageProcess) {

    var objects = gltf[name];

    //Iterate through each object and load its uri
    if (defined(objects)) {
        var ids = Object.keys(objects);
        async.each(ids, function(id, asyncCallback) {
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

                if (name === 'images' && imageProcess) {
                    generateJimpImage(object, function() {
                        process.nextTick(function() {
                           asyncCallback();
                        });
                    });
                } else {
                    process.nextTick(function() {
                        asyncCallback();
                    });
                }
            }
            else {
                var uriPath = uri;
                if (!path.isAbsolute(uriPath)) {
                    if (!defined(basePath)) {
                        throw new DeveloperError('glTF model references external files but no basePath is supplied');
                    }
                    uriPath = path.join(basePath, uriPath);
                }

                fs.readFile(uriPath, function (err, data) {
                    if (err) {
                        asyncCallback(err);
                    }
                    else {
                        object.extras._pipeline.source = data;
                        object.extras._pipeline.extension = path.extname(uri);
                        if (name === 'images' && imageProcess) {
                            generateJimpImage(object, asyncCallback);
                        } else {
                            asyncCallback();
                        }
                    }
                });
            }
        }, function(err) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                else{
                    throw err;
                }
            }
            else if (callback) {
                callback();
            }
        });
    }
    else {
        if (callback) {
            callback();
        }
    }
}

//Return the extension of the data uri
function getImageDataUriFormat(uri) {
    var extension = uri.match('\/([^)]+)\;');
    if (extension === null) {
        throw new DeveloperError('No available image file extension');
    }

    return '.' + extension[1];
}

//Generate a jimp image for png, jpeg, or bmp
function generateJimpImage(object, callback) {
    var pipelineExtras = object.extras._pipeline;
    if (pipelineExtras.extension === '.gif') {
        throw new DeveloperError('gltf pipeline image processing does not currently support gifs.');
    }
    Jimp.read(pipelineExtras.source, function(jimpErr, image) {
        if (jimpErr) {
            throw jimpErr;
        }
        pipelineExtras.jimpImage = image;
        callback();
    });
}
