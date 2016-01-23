'use strict';
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

    // Iterate through cameras and remove those that are not in the hash
    var numberOfCamerasRemoved = 0;
    var cameras = gltf.cameras;
    if (defined(cameras)) {
        var usedCameras = {};

        for (var cameraId in cameras) {
            if (cameras.hasOwnProperty(cameraId)) {
                // If this camera is in the hash, then keep it in the glTF asset
                if (defined(usedCameraIds[cameraId])) {
                    usedCameras[cameraId] = cameras[cameraId];
                } else {
                    ++numberOfCamerasRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfCamerasRemoved += numberOfCamerasRemoved;
        }

        gltf.cameras = usedCameras;
    }


    return gltf;
}