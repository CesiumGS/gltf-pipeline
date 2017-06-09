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
        var jointCount = skin.joints.length;
        var skinnedNodes = nodesForSkinId[skinId];
        var skinnedNodesLength = skinnedNodes.length;
        for (var i = 0; i < skinnedNodesLength; i++) {
            var skinnedNode = skinnedNodes[i];
            var meshId = skinnedNode.mesh;
            if (defined(meshId)) {
                var mesh = meshes[meshId];
                ForEach.meshPrimitive(mesh, function(primitive) {
                    jointCountForMaterialId[primitive.material] = jointCount;
                });
            }
        }
    });

    return jointCountForMaterialId;
}
