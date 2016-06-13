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

module.exports = loadGltfUris;

function loadGltfUris(gltf, basePath, callback) {
    async.each(['buffers', 'images', 'shaders'], function(name, asyncCallback) {
        loadURI(gltf, basePath, name, asyncCallback);
    }, function(err) {
        callback(err, gltf);
    });
}

function loadURI(gltf, basePath, name, callback) {
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
                
                process.nextTick(function() {
                    asyncCallback();
                });
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
                        asyncCallback();
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
