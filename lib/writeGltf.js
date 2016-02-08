'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');
var async = require('async');

module.exports = writeGltf;

function writeGltf(gltf, outputPath, isEmbedded, callback) {
    var shaders = gltf.shaders;
    
    //Write out the source objects, followed by the entire gltf object
    if (defined(shaders)) {
        var shaderIds = Object.keys(shaders);
        async.each(shaderIds, function(shaderId, asyncCallback) {
            var shader = shaders[shaderId];
            if (defined(shader.extras) && defined(shader.extras.source)) {
                var source = shader.extras.source;
                delete shader.extras.source;

                var filePath = path.dirname(outputPath);
                writeSource(filePath, shaderId, shader, source, isEmbedded, asyncCallback);
            }
        }, function(err) {
            if (err) {
                if (callback) {
                        process.nextTick(function() {
                        callback(err);
                    });
                }
                else{
                    throw err;
                }
            }
            else if (callback) {
                process.nextTick(function() {
                    callback();
                });
            }

            fs.writeFile(outputPath, JSON.stringify(gltf, undefined, 2), function (err) {
                if (err) {
                    throw err;
                }
            });        
        });
    }
}

function writeSource(filePath, id, shader, source, isEmbedded, asyncCallback) {
    //Write the source object as a data or file uri depending on the isEmbedded flag
    if (isEmbedded) {
        var sourceDataUri = new dataUri();
        sourceDataUri.format('.txt', source);
        shader.uri = sourceDataUri.content;
        asyncCallback();
    }
    else {
        var fileName = id + '.glsl';
        shader.uri = fileName;
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