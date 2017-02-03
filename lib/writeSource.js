'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var mime = require('mime');
var path = require('path');
var Promise = require('bluebird');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var fsOutputFile = Promise.promisify(fsExtra.outputFile);

module.exports = writeSource;

/**
 * @private
 */
function writeSource(objects, name, basePath, embed, embedImage) {
    var promises = [];
    for (var id in objects) {
        if (objects.hasOwnProperty(id)) {
            var object = objects[id];
            if (defined(object.extras._pipeline.source)) {
                var pipelineExtras = object.extras._pipeline;
                var source = pipelineExtras.source;
                var extension = pipelineExtras.extension;

                if (embed && (embedImage || name !== 'images') || !defined(basePath)) {
                    if (name === 'shaders') {
                        object.uri = 'data:text/plain;base64,' + new Buffer(source).toString('base64');
                    } else {
                        // .crn (Crunch) is not a supported mime type, so add it
                        mime.define({'image/crn' : ['crn']});
                        object.uri = 'data:' + mime.lookup(extension) + ';base64,' + source.toString('base64');
                    }
                } else {
                    // For compressed textures use the name stored in the extras rather than the id
                    var fileName = defaultValue(pipelineExtras.name, id) + extension;
                    object.uri = fileName;
                    var outputPath = path.join(basePath, fileName);
                    promises.push(fsOutputFile(outputPath, source));
                }
            }
        }
    }
    return Promise.all(promises);
}
