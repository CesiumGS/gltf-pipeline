'use strict';
var Cesium = require('cesium');
var _ = require('underscore');

var defined = Cesium.defined;

var NodeHelpers = require('./NodeHelpers');
var getUniqueId = require('./getUniqueId');

module.exports = removeDuplicatePrimitives;

/**
 * Removes duplicate primitives from gltf.
 * Duplicate primitives are primitives within meshes that access the same data.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object}gltf without duplicate primitives.
 */
function removeDuplicatePrimitives(gltf) {
    var meshes = gltf.meshes;
    var seenPrimitives = [];
    var primitivesCount = [];
    var primitivesToMeshes = [];
    var meshIndex;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var index = findObject(seenPrimitives, primitive);
                if (index < 0) {
                    meshIndex = {};
                    meshIndex[meshId] = {};
                    meshIndex[meshId][i] = true;
                    primitivesToMeshes.push(meshIndex);
                    primitivesCount.push(1);
                    seenPrimitives.push(primitive);
                } else {
                    meshIndex = primitivesToMeshes[index][meshId];
                    if (!defined(meshIndex)) {
                        meshIndex = {};
                        primitivesToMeshes[index][meshId] = meshIndex;
                    }
                    meshIndex[i] = true;
                    primitivesCount[index]++;
                }
            }
        }
    }
    removeDuplicatesFromTraversal(gltf, seenPrimitives, primitivesCount, primitivesToMeshes);
    finalizeRemoval(gltf);
    return gltf;
}

var splitMeshPrefix = 'mesh-split';
function removeDuplicatesFromTraversal(gltf, seenPrimitives, primitivesCount, primitivesToMeshes) {
    var meshes = gltf.meshes;
    var nodes = gltf.nodes;
    var meshesToNodes = NodeHelpers.mapMeshesToNodes(gltf);
    var meshId;
    var indices;
    var seenPrimitivesLength = seenPrimitives.length;
    for (var i = 0; i < seenPrimitivesLength; i++) {
        var primitive = seenPrimitives[i];
        if (primitivesCount[i] > 1) {
            var meshInstances = primitivesToMeshes[i];
            var meshIds = Object.keys(meshInstances);
            var meshIdsLength = meshIds.length;
            if (meshIdsLength === 1) {
                meshId = meshIds[0];
                indices = Object.keys(meshInstances[meshId]);
                removePrimitivesFromMesh(gltf, meshId, indices, 1);
            } else {
                var splitMeshId = getUniqueId(gltf, splitMeshPrefix);
                meshes[splitMeshId] = {
                    primitives : [
                        primitive
                    ]
                };
                for (var j = 0; j < meshIdsLength; j++) {
                    meshId = meshIds[j];
                    indices = Object.keys(meshInstances[meshId]);
                    removePrimitivesFromMesh(gltf, meshId, indices, 0);
                    var nodeIds = meshesToNodes[meshId];
                    if (defined(nodeIds)) {
                        var nodeIdsLength = nodeIds.length;
                        for (var k = 0; k < nodeIdsLength; k++) {
                            var nodeId = nodeIds[k];
                            var node = nodes[nodeId];
                            node.meshes.push(splitMeshId);
                        }
                    }
                }
            }
        }
    }
}

function removePrimitivesFromMesh(gltf, meshId, indices, startIndex) {
    var mesh = gltf.meshes[meshId];
    var primitives = mesh.primitives;
    var indicesLength = indices.length;
    for (var i = startIndex; i < indicesLength; i++) {
        primitives[i] = undefined;
    }
}

function finalizeRemoval(gltf) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            for (var i = 0; i < primitives.length; i++) {
                if (!defined(primitives[i])) {
                    primitives.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

function findObject(array, object) {
    var index;
    _.find(array, function(item, i) {
        if (_.isEqual(object, item)) {
            index = i;
            return;
        }
    });
    if (!defined(index)) {
        return -1;
    }
    return index;
}