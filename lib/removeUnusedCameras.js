'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedCameras;

function removeUnusedCameras(gltf, stats) {
    var usedCameraIds = findUsedIds(gltf, 'nodes', 'camera');
    return removeObject(gltf, 'cameras', usedCameraIds, stats);
}