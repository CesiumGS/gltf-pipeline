'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var isDataUri = require('./isDataUri');
var dataUriToBuffer = require('data-uri-to-buffer');

module.exports = loadGltfUris;

function loadGltfUris(gltf, basePath, callback) {
    var shaders = gltf.shaders;
    if (defined(shaders)) {
        for (var id in shaders) {
            if (shaders.hasOwnProperty(id)) {
                var shader = shaders[id];
                shader.extras = defaultValue(shader.extras, {});

                var uri = shader.uri;
                shader.extras = loadURI(gltf, basePath, shader.extras, uri, callback);
            }
        }
    }

    return new Promise(function(resolve) {
        resolve(gltf);
    });
}

function loadURI(gltf, basePath, extras, uri, callback) {
    if (isDataUri(uri)) {
        extras.source = dataUriToBuffer(uri);

        if (callback) {
            process.nextTick(function() {
                callback();
            });
        }
    }
    else {
        var uriPath = path.join(basePath, uri);

        fs.readFile(uriPath, function (err, data) {
            if (err) {
                if (callback) {
                    process.nextTick(function() {
                        callback(err);
                    });
                }
                else {
                    throw err;
                }
            }
            else {
                extras.source = data;

                if (callback) {
                    process.nextTick(function() {
                        callback();
                    });
                }
            }
        });
    }
}