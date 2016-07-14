'use strict';

var Cesium = require('cesium');
var DataUri = require('datauri');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');

var defined = Cesium.defined;

var fsWriteFile = Promise.promisify(fs.writeFile);

module.exports = writeSource;

/**
 * @private
 */
function writeSource(gltf, basePath, name, embed, embedImage) {
    var promises = [];
    var objects = gltf[name];
    for (var id in objects) {
        if (objects.hasOwnProperty(id)) {
            var object = objects[id];
            if (defined(object.extras._pipeline.source)) {
                var source = object.extras._pipeline.source;
                var extension = object.extras._pipeline.extension;

                if (embed && (embedImage || name !== 'images') || !defined(basePath)) {
                    var sourceDataUri = new DataUri();
                    if (name === 'shaders') {
                        sourceDataUri.format('.txt', source);
                    } else {
                        sourceDataUri.format(extension, source);
                    }
                    object.uri = sourceDataUri.content;
                } else {
                    var fileName = id + extension;
                    object.uri = fileName;
                    var outputPath = path.join(basePath, fileName);
                    promises.push(fsWriteFile(outputPath, source));
                }
            }
        }
    }
    return Promise.all(promises);
}
