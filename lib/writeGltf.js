'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = writeGltf;

function writeGltf(gltf, outputPath, isEmbedded, createDirectory, callback) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
    }
    var filePath = path.dirname(outputPath);

    async.each(['images', 'shaders'], function(name, asyncCallback) {
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
            if (defined(object.extras) && defined(object.extras,source)) {
                var source = object.extras.source;
                delete object.extras.source;

                //Write the source object as a data or file uri depending on the isEmbedded flag
                if (isEmbedded) {
                    var sourceDataUri = new dataUri();
                    switch (name) {
                        case 'images':
                            sourceDataUri.format('.png', source);
                            break;
                        case 'shaders':
                            sourceDataUri.format('.txt', source);
                            break;
                        default:
                            throw new Error('Trying to embed invalid file type.');
                    }
                    object.uri = sourceDataUri.content;
                    process.nextTick(function() {
                        asyncCallback();
                    });
                }
                else {
                    //Choose file extension depending on object type
                    var fileName = id;
                    switch (name) {
                        case 'images':
                            fileName += '.png';
                            break;
                        case 'shaders':
                            fileName += '.glsl';
                            break;
                        default:
                            throw new Error('Trying to write out invalid file type.');
                    }

                    object.uri = fileName;
                    var outputPath = path.join(filePath, fileName);
                    fs.writeFile(outputPath, source, function (err) {
                        if (err) {
                            asyncCallback(err);
                        }
                        else{
                            asyncCallback();
                        }
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