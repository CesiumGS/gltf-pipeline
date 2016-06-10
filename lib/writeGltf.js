'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');
var async = require('async');
var mkdirp = require('mkdirp');
var writeSource = require('./writeSource');
var removePipelineExtras = require('./removePipelineExtras');

module.exports = writeGltf;

function writeGltf(gltf, outputPath, embed, createDirectory, callback) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
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
            fs.writeFile(outputPath, JSON.stringify(gltf, undefined, 2), function (err) {
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
