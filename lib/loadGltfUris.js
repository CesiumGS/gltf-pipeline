'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var isDataUri = require('./isDataUri');
var dataUriToBuffer = require('data-uri-to-buffer');
var async = require('async');

module.exports = loadGltfUris;

function loadGltfUris(gltf, basePath, callback) {
    async.each(['images', 'shaders'], function(name, asyncCallback) {
            loadURI(gltf, basePath, name, asyncCallback);
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
        }
    );

    return gltf;
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

            //Load the uri into the extras object based on the uri type
            if (isDataUri(uri)) {
                object.extras.source = dataUriToBuffer(uri);
                switch (name) {
                    case 'images':
                        object.extras.extension = getImageDataUriFormat(uri);
                        break;
                    case 'shaders':
                        object.extras.extension = '.glsl';
                        break;
                }
                process.nextTick(function() {
                    asyncCallback();
                });
            }
            else {
                var uriPath = path.join(basePath, uri);
                fs.readFile(uriPath, function (err, data) {
                    if (err) {
                        asyncCallback(err);
                    }
                    else {
                        object.extras.source = data;
                        object.extras.extension = path.extname(uri);
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

 function getImageDataUriFormat(uri) {
    //Return the extension of the data uri
    return '.' + uri.match('\/([^)]+)\;')[1];
 }