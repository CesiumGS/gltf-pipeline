'use strict';
var path = require('path');
var fs = require('fs');
var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var loadGltfUris = require('./loadGltfUris');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = readGltf;

function readGltf(gltfPath, callback) {
    var fileExtension = path.extname(gltfPath);
    var filePath = path.dirname(gltfPath);

    if (!defined(gltfPath)) {
        throw new DeveloperError('Input path is undefined.');
    }
    
    if (fileExtension !== '.glb' && fileExtension !== '.gltf') {
        throw new DeveloperError('Invalid glTF file.');
    }
    
    fs.readFile(gltfPath, function(err, data) {
        if (err) {
            throw err;
        }
    
        var gltf;
        if (fileExtension === '.glb') {
            gltf = parseBinaryGltf(data);
        }
        else if (fileExtension === '.gltf') {
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
        }
        loadGltfUris(gltf, filePath, function(err, gltf) {
            if (err) {
                throw err;
            }
            callback(gltf);
        });
    });
}
