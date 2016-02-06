'use strict';
var fs = require('fs');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUriToBuffer = require('data-uri-to-buffer');

module.exports = loadGltfUris;

function loadGltfUris(path, gltf, callback) {
    var shaders = gltf.shaders;
    if (defined(shaders)) {
        for (var id in shaders) {
            if (shaders.hasOwnProperty(id)) {
                var shader = shaders[id];
                shader.extras = shader.extras || {};

                var uri = shader.uri;
                loadURI(gltf, path, shader.extras, uri, callback);
            }
        }
    }

    return gltf;
}

function loadURI(gltf, path, extras, uri, callback) {
    if (!/^data\:/i.test(uri)) {
        var uriPath = path + '\\' + uri;
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
    else {
        var buffer = dataUriToBuffer(uri);
        extras.source = buffer;

        if (callback) {
            process.nextTick(function() {
                callback();
            });
        }
    }
}