'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defined = Cesium.defined;

module.exports = getJointCountForMaterials;

function getJointCountForMaterials(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var jointCountForMaterialId = {};

    var nodesForSkinId = {};
    ForEach.node(gltf, function(node) {
        if (defined(node.skin)) {
            if (!defined(nodesForSkinId[node.skin])) {
                nodesForSkinId[node.skin] = [];
            }
            nodesForSkinId[node.skin].push(node);
        }
    });

    ForEach.skin(gltf, function(skin, skinId) {
        var jointCount = 1;
        if (defined(skin.inverseBindMatrices)) {
            jointCount = accessors[skin.inverseBindMatrices].count;
        }
        var skinnedNodes = nodesForSkinId[skinId];
        var skinnedNodesLength = skinnedNodes.length;
        for (var i = 0; i < skinnedNodesLength; i++) {
            var skinnedNode = skinnedNodes[i];
            var meshId = skinnedNode.mesh;
            if (defined(meshId)) {
                var mesh = meshes[meshId];
                var primitives = mesh.primitives;
                var primitivesLength = primitives.length;
                for (var k = 0; k < primitivesLength; k++) {
                    var primitive = primitives[k];
                    jointCountForMaterialId[primitive.material] = jointCount;
                }
            }
        }
    });

    return jointCountForMaterialId;
}
