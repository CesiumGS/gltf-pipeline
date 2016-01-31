'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedMeshes;

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