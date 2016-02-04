'use strict';
var fs = require('fs');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = loadGltfUris;

function loadGltfUris(path, gltf, callback) {
    var shaders = gltf.shaders;
    // process.stdout.write('START\n');
    // console.log(gltf);
    if (defined(shaders)) {
        for (var id in shaders) {
            if (shaders.hasOwnProperty(id)) {
                var shader = shaders[id];
                // process.stdout.write('SHADER: ' + shader + '\n');
                // var extras = shader.extras;
                // if (!defined(extras)) {
                //     shader.extras = {};
                // }
                // extras = shader.extras;
                shader.extras = shader.extras || {};

                var uri = shader.uri;
                loadURI(gltf, path, shader.extras, uri, callback);
            }
        }
    }

    return gltf;
}

function loadURI(gltf, path, extras, uri, callback) {
    var uriPath = path + '\\' + uri;
    // fs.readFile('./specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestError.glsl', function (err, data) {

    fs.readFile(uriPath, function (err, data) {
        if (err) {
            // throw new Error("Unexpected error!");
            throw err;
            callback();
            process.stdout.write('THROWING ERROR\n');
        }
        // process.stdout.write('DATA: ' + data + '\n');

        extras.source = data;

        if (callback) {
            callback(uri);
        }
    });
}