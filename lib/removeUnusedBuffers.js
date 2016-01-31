'use strict';
var removeObject = require('./removeObject');
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

// TODO: remove orphan uris

    return removeObject(gltf, 'buffers', usedBufferIds, stats);
}