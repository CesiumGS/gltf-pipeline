/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var objectValues = require('object-values');

var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers into one buffer.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} bufferName The id to use for the combined buffer.
 * @returns {Object} The glTF asset with one combined buffer.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function mergeBuffers(gltf, bufferName) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var bufferViewsForBuffers = getBufferViewsForBuffers(gltf);

    if (defined(buffers)) {
        var source = new Buffer(0);
        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                //Add the buffer to the merged source
                var buffer = buffers[bufferId];
                var bufferViewIds = bufferViewsForBuffers[bufferId];
                for (var bufferViewId in bufferViewIds) {
                    if (bufferViewIds.hasOwnProperty(bufferViewId)) {
                        var bufferView = bufferViews[bufferViewId];
                        bufferView.byteOffset += source.length;
                        bufferView.buffer = bufferName;
                    }
                }
                source = Buffer.concat([source, buffer.extras._pipeline.source]);
            }
        }

        //Replace existing buffer with new merged buffer
        gltf.buffers = {};
        gltf.buffers[bufferName] = {
            "type": "arraybuffer",
            "byteLength": source.length,
            "uri": "data:,",
            "extras": {
                "_pipeline": {
                    "source": source,
                    "extension": ".bin",
                    "deleteExtras": true
                }
            }
        };
    }
    return gltf;
}

function getBufferViewsForBuffers(gltf) {
    var bufferViewsForBuffers = {};
    var bufferViews = gltf.bufferViews;
    for (var bufferViewId in bufferViews) {
        if (bufferViews.hasOwnProperty(bufferViewId)) {
            var bufferView = bufferViews[bufferViewId];
            var bufferId = bufferView.buffer;
            var bufferViewsForBuffer = bufferViewsForBuffers[bufferId];
            if (!defined(bufferViewsForBuffer)) {
                bufferViewsForBuffer = {};
                bufferViewsForBuffers[bufferId] = bufferViewsForBuffer;
            }
            bufferViewsForBuffer[bufferViewId] = true;
        }
    }
    return bufferViewsForBuffers;
}