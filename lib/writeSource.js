'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var mime = require('mime');
var path = require('path');
var Promise = require('bluebird');
var ForEach = require('./ForEach');
var isDataUri = require('./isDataUri');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var fsOutputFile = Promise.promisify(fsExtra.outputFile);

// .crn (Crunch) is not a supported mime type, so add it
mime.define({'image/crn': ['crn']});

module.exports = writeSource;

/**
 * @private
 */
function writeSource(arrayOfObjects, name, basePath, options) {
    var embed = defaultValue(options.embed, true);
    var embedImage = defaultValue(options.embedImage, true);
    var promises = [];
    ForEach.object(arrayOfObjects, function(object, i) {
        if (defined(object.extras._pipeline.source)) {
            var pipelineExtras = object.extras._pipeline;
            var source = pipelineExtras.source;
            var extension = pipelineExtras.extension;

            // Write sources for compressed textures
            if (name === 'images') {
                var image = object;
                if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
                    var compressedImages = image.extras.compressedImage3DTiles;
                    promises.push(writeSource(compressedImages, 'images', undefined, embed, embedImage));
                }
            }

            if (embed && (embedImage || name !== 'images') || !defined(basePath)) {
                if (name === 'shaders') {
                    object.uri = 'data:text/plain;base64,' + new Buffer(source).toString('base64');
                } else {
                    var mimeType = object.mimeType;
                    if (!defined(mimeType)) {
                        mimeType = mime.lookup(extension);
                    }
                    object.uri = 'data:' + mimeType + ';base64,' + source.toString('base64');
                }
            } else {
                var fileName = i + extension;
                // Use the name if we have one
                if (defined(object.name)) {
                    fileName = object.name + extension;
                }
                var uri = object.uri;
                if (defined(uri) && !isDataUri(uri)) {
                    // Use the original filename if it was external
                    fileName = uri;
                }
                // For compressed textures use the name stored in the extras rather than the id
                if (defined(pipelineExtras.name)) {
                    fileName = pipelineExtras.name + extension;
                }
                object.uri = fileName;
                var outputPath = path.join(basePath, fileName);
                promises.push(fsOutputFile(outputPath, source));
            }
        }
    });
    return Promise.all(promises);
}
