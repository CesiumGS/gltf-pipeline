'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers into one buffer.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} [bufferId] The id to use for the combined buffer, generates a unique id if undefined.
 * @returns {Object} The glTF asset with one combined buffer.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function mergeBuffers(gltf) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var bufferViewsForBuffers = getBufferViewsForBuffers(gltf);

    if (defined(buffers) && buffers.length > 0) {
        var buffersToMerge = [];
        var lengthSoFar = 0;
        ForEach.buffer(gltf, function(buffer, bufferId) {
            var bufferViewIds = bufferViewsForBuffers[bufferId];
            for (var bufferViewId in bufferViewIds) {
                if (bufferViewIds.hasOwnProperty(bufferViewId)) {
                    var bufferView = bufferViews[bufferViewId];
                    bufferView.byteOffset += lengthSoFar;
                    bufferView.buffer = 0;
                }
            }
            buffersToMerge.push(buffer.extras._pipeline.source);
            lengthSoFar += buffer.extras._pipeline.source.length;
        });

        var source = Buffer.concat(buffersToMerge, lengthSoFar);

        //Replace existing buffer with new merged buffer
        gltf.buffers = [{
            byteLength: source.length,
            extras: {
                _pipeline: {
                    source: source,
                    extension: '.bin'
                }
            }
        }];
    }
    return gltf;
}

function getBufferViewsForBuffers(gltf) {
    var bufferViewsForBuffers = {};
    ForEach.bufferView(gltf, function(bufferView, bufferViewId) {
        var bufferId = bufferView.buffer;
        var bufferViewsForBuffer = bufferViewsForBuffers[bufferId];
        if (!defined(bufferViewsForBuffer)) {
            bufferViewsForBuffer = {};
            bufferViewsForBuffers[bufferId] = bufferViewsForBuffer;
        }
        bufferViewsForBuffer[bufferViewId] = true;
    });
    return bufferViewsForBuffers;
}
