'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedBufferViews;

function removeUnusedBufferViews(gltf, stats) {
    var usedBufferViewIds = {};
    var accessors = gltf.accessors;

    // Build hash of used bufferViews by iterating through accessors
    if (defined(accessors)) {
        for (var accessorId in accessors) {
            if (accessors.hasOwnProperty(accessorId)) {
                var id = accessors[accessorId].bufferView;
                usedBufferViewIds[id] = true;
            }
        }
    }

    // Iterate through bufferViews and remove those that are not in the hash
    var numberOfBufferViewsRemoved = 0;
    var bufferViews = gltf.bufferViews;
    if (defined(bufferViews)) {
        var usedBufferViews = {};

        for (var bufferViewId in bufferViews) {
            if (bufferViews.hasOwnProperty(bufferViewId)) {
                // If this bufferView is in the hash, then keep it in the glTF asset
                if (defined(usedBufferViewIds[bufferViewId])) {
                    usedBufferViews[bufferViewId] = bufferViews[bufferViewId];
                } else {
                    ++numberOfBufferViewsRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfBufferViewsRemoved += numberOfBufferViewsRemoved;
        }

        gltf.bufferViews = usedBufferViews;
    }

// TODO: remove orphan uris

    return gltf;
}