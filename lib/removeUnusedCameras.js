'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedCameras;

/**
 * Remove all unused cameras in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused cameras.
 */
function removeUnusedCameras(gltf, stats) {
    var usedCameraIds = findUsedIds(gltf, 'nodes', 'camera');
    return removeObject(gltf, 'cameras', usedCameraIds, stats);
}