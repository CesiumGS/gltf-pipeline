'use strict';
var Cesium = require('cesium');
var getUniqueId = require('./getUniqueId');

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
function mergeBuffers(gltf, bufferId) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var bufferViewsForBuffers = getBufferViewsForBuffers(gltf);

    if (defined(buffers)) {
        var buffersToMerge = [];
        var lengthSoFar = 0;
        for (var gltfBufferId in buffers) {
            if (buffers.hasOwnProperty(gltfBufferId)) {
                //Add the buffer to the merged source
                var buffer = buffers[gltfBufferId];
                if (!defined(bufferId)) {
                    bufferId = gltfBufferId;
                }
                var bufferViewIds = bufferViewsForBuffers[gltfBufferId];
                for (var bufferViewId in bufferViewIds) {
                    if (bufferViewIds.hasOwnProperty(bufferViewId)) {
                        var bufferView = bufferViews[bufferViewId];
                        bufferView.byteOffset += lengthSoFar;
                        bufferView.buffer = bufferId;
                    }
                }

                // We check that each buffer is 4 byte aligned. Float buffers must start on a 4-byte boundary
                //  so merging in a buffer that isn't 4-byte aligned requires that padding be added.
                var sourceBuffer = buffer.extras._pipeline.source;
                var currentBufferLength = sourceBuffer.length;
                if (currentBufferLength % 4)
                {
                    currentBufferLength += 4 - (currentBufferLength % 4);
                    var newBuffer = Buffer.alloc(currentBufferLength);
                    sourceBuffer.copy(newBuffer);
                    sourceBuffer = buffer.extras._pipeline.source = newBuffer;
                }

                buffersToMerge.push(sourceBuffer);
                lengthSoFar += currentBufferLength;
            }
        }

        var source = Buffer.concat(buffersToMerge, lengthSoFar);

        if (!defined(bufferId)) {
            bufferId = getUniqueId(gltf, 'buffer');
        }

        //Replace existing buffer with new merged buffer
        gltf.buffers = {};
        gltf.buffers[bufferId] = {
            "type": "arraybuffer",
            "byteLength": source.length,
            "uri": "data:,",
            "extras": {
                "_pipeline": {
                    "source": source,
                    "extension": ".bin"
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
