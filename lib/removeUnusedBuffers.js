'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedBuffers;

function removeUnusedBuffers(gltf, stats) {
    var usedBufferIds = {};
    var bufferViews = gltf.bufferViews;

    // Build hash of used buffers by iterating through bufferViews
    if (defined(bufferViews)) {
        for (var bufferViewId in bufferViews) {
            if (bufferViews.hasOwnProperty(bufferViewId)) {
                var id = bufferViews[bufferViewId].buffer;
                usedBufferIds[id] = true;
            }
        }
    }

    // Iterate through buffers and remove those that are not in the hash
    var numberOfBuffersRemoved = 0;
    var buffers = gltf.buffers;
    if (defined(buffers)) {
        var usedBuffers = {};

        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                // If this buffer is in the hash, then keep it in the glTF asset
                if (defined(usedBufferIds[bufferId])) {
                    usedBuffers[bufferId] = buffers[bufferId];
                } else {
                    ++numberOfBuffersRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfBuffersRemoved += numberOfBuffersRemoved;
        }

        gltf.buffers = usedBuffers;
    }

// TODO: remove orphan uris

    return gltf;
}