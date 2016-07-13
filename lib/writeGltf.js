'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var async = require('async');
var writeSource = require('./writeSource');
var removePipelineExtras = require('./removePipelineExtras');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = writeGltf;

function writeGltf(gltf, outputPath, embed, embedImage, createDirectory, callback) {
    if (!defined(outputPath)) {
        throw new DeveloperError('Output path is undefined.');
    }

    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.gltf') {
        throw new DeveloperError('Invalid output path extension.');
    }
    // Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
    }
    var basePath = path.dirname(outputPath);

    async.each(['buffers', 'images', 'shaders'], function(name, asyncCallback) {
        writeSource(gltf, basePath, name, embed, embedImage, asyncCallback);
    }, function(err) {
        if (err) {
            if (callback) {
                callback(err);
            } else {
                throw err;
            }
        } else {
            removePipelineExtras(gltf);
            fsExtra.outputJson(outputPath, gltf, function (err) {
                if (err) {
                    throw err;
                }
                if (callback) {
                    callback();
                }
            });
        }
    });
}
