'use strict';
var fs = require('fs');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = parseGLTF;

function parseGLTF(dir, gltfData, callback) {
    var gltf = JSON.parse(gltfData);
    gltf.loadedShaders = {};

    var shaders = gltf.shaders;
    if (defined(shaders)) {
        for (var shaderId in shaders) {
            if (shaders.hasOwnProperty(shaderId)) {
                var uri = shaders[shaderId].uri;
                loadURI(gltf, dir, uri, 'loadedShaders', callback);
            }
        }
    }

    return gltf;
}

function loadURI(gltf, dir, uri, loadId, callback) {
    var uriPath = dir + '\\' + uri;
    fs.readFile(uriPath, function (err, data) {
        if (err) {
            throw err;
        }

        gltf[loadId][uri] = data;

        if (callback) {
            callback(loadId, uri);
        }
    });
}