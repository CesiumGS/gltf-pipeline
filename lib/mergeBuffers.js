/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var objectValues = require('object-values');

var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers into one buffer.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {String} bufferName The id to use for the combined buffer.
 * @returns {Object} gltf with one combined buffer.
 *
 * gltf must be initialized for the pipeline.
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function mergeBuffers(gltf, bufferName) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

    if (defined(buffers)) {
        var currentOffset = 0;
        var source = new Buffer(0);

        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                //Add the buffer to the merged source
                var buffer = buffers[bufferId];
                source = Buffer.concat([source, buffer.extras._pipeline.source]);

                if (defined(bufferViews)) {
                    //Update the offset for each accessing bufferView
                    var accessingBufferViews = objectValues(bufferViews);
                    accessingBufferViews = accessingBufferViews.filter(function(bufferView) {
                        return bufferView.buffer === bufferId;
                    });
                    var maxEndOffset = 0;
                    for (var i = 0; i < accessingBufferViews.length; i++) {
                        var currentView = accessingBufferViews[i];
                        maxEndOffset = Math.max(maxEndOffset, currentView.byteOffset + currentView.byteLength);
                        currentView.buffer = bufferName;
                        currentView.byteOffset += currentOffset;
                    }
                    currentOffset += maxEndOffset;
                }
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