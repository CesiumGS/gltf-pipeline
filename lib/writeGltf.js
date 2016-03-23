'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');
var async = require('async');
var mkdirp = require('mkdirp');
var removePipelineExtras = require('./removePipelineExtras');

module.exports = writeGltf;

function writeGltf(gltf, outputPath, isEmbedded, createDirectory, callback) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
    }
    var filePath = path.dirname(outputPath);

    async.each(['buffers', 'images', 'shaders'], function(name, asyncCallback) {
            writeSource(gltf, filePath, name, isEmbedded, asyncCallback);
        }, function(err) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                else{
                    throw err;
                }
            }
            else{
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
        }
    );
}

function writeSource(gltf, filePath, name, isEmbedded, callback) {
    var objects = gltf[name];

    //Iterate through each object and write out its uri
    if (defined(objects)) {
        var ids = Object.keys(objects);
        async.each(ids, function(id, asyncCallback) {
            var object = objects[id];
            if (defined(object.extras._pipeline.source)) {
                var source = object.extras._pipeline.source;
                var extension = object.extras._pipeline.extension;

                //Write the source object as a data or file uri depending on the isEmbedded flag
                if (isEmbedded) {
                    var sourceDataUri = new dataUri();
                    if (name === 'shaders') {
                        sourceDataUri.format('.txt', source);
                    }
                    else {
                        sourceDataUri.format(extension, source);
                    }
                    object.uri = sourceDataUri.content;
                    process.nextTick(function() {
                        asyncCallback();
                    });
                }
                else {
                    var fileName = id + extension;
                    object.uri = fileName;
                    var outputPath = path.join(filePath, fileName);
                    fs.writeFile(outputPath, source, function (err) {
                        asyncCallback(err);
                    });  
                }
            }
        }, function(err) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                else{
                    throw err;
                }
            }
            else if (callback) {
                callback();
            }
        });
    }
    else {
        if (callback) {
            callback();
        }
    }
}