'use strict';
var removeObject = require('./removeObject');
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

// TODO: remove orphan uris

    return removeObject(gltf, 'bufferViews', usedBufferViewIds, stats);
}