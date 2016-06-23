'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var getBinaryGltf = require('./getBinaryGltf');

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, outputPath, createDirectory, callback) {
    // Correct output path extension if necessary
    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.glb') {
        outputPath = path.join(path.dirname(outputPath), path.basename(outputPath, outputExtension) + '.glb');
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