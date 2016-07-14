'use strict';
var Cesium = require('cesium');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var loadGltfUris = require('./loadGltfUris');

module.exports = readGltf;

function readGltf(gltfPath, options) {
    if (!defined(gltfPath)) {
        throw new DeveloperError('Input path is undefined.');
    }

    if (!defined(options.basePath)) {
        options.basePath = path.dirname(gltfPath);
    }

    var fileExtension = path.extname(gltfPath);

    if (fileExtension !== '.glb' && fileExtension !== '.gltf') {
        throw new DeveloperError('Invalid glTF file.');
    }
    return readFile(gltfPath)
        .then(function(data) {
            var gltf;
            if (fileExtension === '.glb') {
                gltf = parseBinaryGltf(data);
            }
            else if (fileExtension === '.gltf') {
                gltf = JSON.parse(data);
                addPipelineExtras(gltf);
            }
            return loadGltfUris(gltf, options);
        })
        .then(function(gltf) {
            return gltf;
        });
}
