'use strict';
var fse = require('fs-extra');
var path = require('path');
var async = require('async');
var getBinaryGltf = require('./getBinaryGltf');
var writeSource = require('./writeSource');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, options, callback) {
    var outputPath = options.outputPath;
    var embed = options.embed;
    var embedImage = options.embedImage;
    var createDirectory = options.createDirectory;

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
    fse.ensureDirSync(path.dirname(outputPath));

    var basePath = path.dirname(outputPath);
    async.each(['images', 'shaders'], function (name, asyncCallback) {
        writeSource(gltf, basePath, name, embed, embedImage, asyncCallback);
    }, function (err) {
        if (err) {
            if (callback) {
                callback(err);
            } else {
                throw err;
            }
        } else {
            var glb = getBinaryGltf(gltf, embed, embedImage, function (header, scene, body) {
                fse.outputFile(outputPath, glb, function (err) {
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
    });
}
