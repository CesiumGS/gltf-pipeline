'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var dataUri = require('datauri');
var async = require('async');

module.exports = writeSource;

/**
 * @private
 */
function writeSource(gltf, basePath, name, embed, callback) {
    var objects = gltf[name];

    //Iterate through each object and write out its uri
    if (defined(objects)) {
        var ids = Object.keys(objects);
        async.each(ids, function(id, asyncCallback) {
            var object = objects[id];
            if (defined(object.extras._pipeline.source)) {
                var source = object.extras._pipeline.source;
                var extension = object.extras._pipeline.extension;

                //Write the source object as a data or file uri depending on the embed flag
                if (embed) {
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
                    var outputPath = path.join(basePath, fileName);
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
