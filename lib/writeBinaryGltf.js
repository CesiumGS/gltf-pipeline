'use strict';
var fs = require('fs');
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');
var getBinaryGltf = require('./getBinaryGltf');
var writeSource = require('./writeSource');

module.exports = writeBinaryGltf;

function writeBinaryGltf(options, callback) {
    var gltf = options.gltf;
    var outputPath = options.outputPath;
    var embed = options.embed;
    var embedImage = options.embedImage;
    var createDirectory = options.createDirectory;

    // Correct output path extension if necessary
    var outputExtension = path.extname(outputPath);
    if (outputExtension !== '.glb') {
        throw new DeveloperError('Invalid output path extension.');
    }
    // Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
    }
    mkdirp.sync(path.dirname(outputPath));

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
    });
}
