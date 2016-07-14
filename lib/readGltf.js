'use strict';
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var readFile = Promise.promisify(fs.readFile);
var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var loadGltfUris = require('./loadGltfUris');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

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
    var gltf;
    return readFile(gltfPath)
        .then(function(data) {
            if (fileExtension === '.glb') {
                gltf = parseBinaryGltf(data);
            }
            else if (fileExtension === '.gltf') {
                gltf = JSON.parse(data);
                addPipelineExtras(gltf);
            }
            return loadGltfUris(gltf, options);
        }).then(function() {
            return gltf;
        })
        .catch(function(err) {
            throw err;
        });
}
