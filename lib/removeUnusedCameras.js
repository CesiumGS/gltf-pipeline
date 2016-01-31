'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedCameras;

function removeUnusedCameras(gltf, stats) {
    var usedCameraIds = {};
    var nodes = gltf.nodes;

    // Build hash of used cameras by iterating through nodes
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                if (defined(nodes[nodeId].camera)) {
                    var id = nodes[nodeId].camera;
                    usedCameraIds[id] = true;
                }
            }
        }
    }

    return removeObject(gltf, 'cameras', usedCameraIds, stats);
}