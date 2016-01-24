'use strict';
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

    // Iterate through meshes and remove those that are not in the hash
    var numberOfMeshesRemoved = 0;
    var meshes = gltf.meshes;
    if (defined(meshes)) {
        var usedMeshes = {};

        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                // If this mesh is in the hash, then keep it in the glTF asset
                if (defined(usedMeshIds[meshId])) {
                    usedMeshes[meshId] = meshes[meshId];
                } else {
                    ++numberOfMeshesRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfMeshesRemoved += numberOfMeshesRemoved;
        }

        gltf.meshes = usedMeshes;
    }

    return gltf;
}