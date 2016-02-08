'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');

module.exports = writeGltf;

function writeGltf(gltf, basePath, isEmbedded, callback) {
    var shaders = gltf.shaders;
    if (defined(shaders)) {
        for (var id in shaders) {
            if (shaders.hasOwnProperty(id)) {
                var shader = shaders[id];
                
                if (defined(shader.extras) && defined(shader.extras.source)) {
                    var source = shader.extras.source;
                    delete shader.extras.source;

                    if (isEmbedded) {
                        var sourceDataUri = new dataUri();
                        sourceDataUri.format('.txt', source);
                        shader.uri = sourceDataUri.content;
                    }
                    else {
                        var fileName = id + '.glsl';
                        shader.uri = fileName;

                        var outputPath = path.join(basePath, fileName);
                        fs.writeFile(outputPath, source, function (err) {
                            if (err) {
                                throw err;
                            }

                            if (callback) {
                                callback();
                            }
                        });  
                    }
                }
            }
        }
    }
}