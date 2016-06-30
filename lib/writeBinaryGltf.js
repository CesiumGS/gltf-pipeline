'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var getBinaryGltf = require('./getBinaryGltf');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, outputPath, createDirectory, callback) {
    if (!defined(outputPath)) {
        throw new DeveloperError('Output path is undefined.');
    }
    
    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.glb') {
        throw new DeveloperError('Invalid output path extension.');
    }
    // Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
    }
    mkdirp.sync(path.dirname(outputPath));

    var glb = getBinaryGltf(gltf, function(header, scene, body) {
        fs.writeFile(outputPath, glb, function (err) {
            if (err) {
                if (callback) {
                    callback(err);
                } else {
                    throw err;
                }
            } else if (callback) {
                callback(undefined, header, scene, body);
            }
        });
    });
}