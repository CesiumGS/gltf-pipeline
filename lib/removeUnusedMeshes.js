'use strict';
var Cesium = require('cesium');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = removeUnusedMeshes;

/**
 * Remove all unused meshes in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused meshes.
 */
function removeUnusedMeshes(gltf, stats) {
    var usedMeshIds = {};
    var nodes = gltf.nodes;

    // Build hash of used meshes by iterating through nodes
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                if (defined(nodes[nodeId].meshes)) {
                    var nodeMeshes = nodes[nodeId].meshes;
                    var length = nodeMeshes.length;
                    for (var i = 0; i < length; i++) {
                        var id = nodeMeshes[i];
                        usedMeshIds[id] = true;
                    }
                }
            }
        }
    }

    return removeObject(gltf, 'meshes', usedMeshIds, stats);
}