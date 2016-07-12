'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
module.exports = combineMeshes;



/**
 * Combines meshes within each node.
 * Should be run before the combinePrimitives stage to merge all primitives for a node into one mesh.
 *
 * @param {Object} gltf - An object holding a glTF hierarchy
 * 
 * @returns glTF with combined meshes
 */
function combineMeshes(gltf) {
    var nodes = gltf.nodes;
    var meshes = gltf.meshes;

    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                var node = nodes[nodeId];
                var nodeMeshes = node.meshes;

                if (defined(nodeMeshes) && nodeMeshes.length > 1) {
                    //Find the next available id for the combined mesh.
                    var idCount = 0;
                    var newMeshId = nodeId + '_mesh_' + idCount;
                    var objectKeys = Object.keys(meshes);
                    while (objectKeys.indexOf(newMeshId) !== -1) {
                        idCount++;
                        newMeshId = newMeshId.slice(0, -1) + idCount;
                    }

                    //Combine all the primitives from the meshes into one array.
                    var primitiveList = [];
                    for (var i = 0; i < nodeMeshes.length; i++) {
                        var primitives = meshes[nodeMeshes[i]].primitives;
                        if (defined(primitives)) {
                            for (var j = 0; j < primitives.length; j++) {
                                primitiveList.push(primitives[j]);
                            }
                        }
                    }

                    //Create a new mesh with all the primitives and the node id.
                    var newMesh = {
                        "name": nodeId + '_mesh',
                        "primitives": primitiveList,
                        "extras": {
                            "_pipeline": {
                                "deleteExtras": true
                            }
                        }
                    };

                    node.meshes = [newMeshId];
                    meshes[newMeshId] = newMesh;
                }
            }
        }
    }

    return gltf;
}