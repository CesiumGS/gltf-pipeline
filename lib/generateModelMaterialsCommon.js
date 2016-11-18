'use strict';
var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');

var defined = Cesium.defined;

module.exports = generateModelMaterialsCommon;

/**
 * Converts materials to use the KHR_materials_common extension and deletes
 * techniques, programs and shaders.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [kmcOptions] KHR_materials_common options for material generation.
 * @returns {Object} The glTF asset with generated normals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateModelMaterialsCommon(gltf, kmcOptions) {
    delete gltf.techniques;
    delete gltf.programs;
    delete gltf.shaders;
    addExtensionsUsed(gltf, 'KHR_materials_common');
    var materials = gltf.materials;
    var jointCountForMaterialId = getJointCountForMaterials(gltf);
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            delete material.technique;
            var extensions = material.extensions;
            if (!defined(extensions)) {
                extensions = {};
                material.extensions = extensions;
            }
            var materialsCommon = {};
            extensions.KHR_materials_common = materialsCommon;
            for (var kmcOption in kmcOptions) {
                if (kmcOptions.hasOwnProperty(kmcOption) && kmcOption !== 'enable') {
                    materialsCommon[kmcOption] = kmcOptions[kmcOption];
                }
            }
            var jointCount = jointCountForMaterialId[materialId];
            if (defined(jointCount)) {
                materialsCommon.jointCount = jointCount;
            }
            materialsCommon.values = material.values;
            delete material.values;
        }
    }
    return gltf;
}

function getJointCountForMaterials(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var nodes = gltf.nodes;
    var skins = gltf.skins;
    var jointCountForMaterialId = {};

    var nodesForSkinId = {};
    for (var nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
            var node = nodes[nodeId];
            if (defined(node.skin)) {
                if (!defined(nodesForSkinId[node.skin])) {
                    nodesForSkinId[node.skin] = [];
                }
                nodesForSkinId[node.skin].push(node);
            }
        }
    }

    for (var skinId in skins) {
        if (skins.hasOwnProperty(skinId)) {
            var skin = skins[skinId];
            var jointCount = 1;
            if (defined(skin.inverseBindMatrices)) {
                jointCount = accessors[skin.inverseBindMatrices].count;
            }
            var skinnedNodes = nodesForSkinId[skinId];
            var skinnedNodesLength = skinnedNodes.length;
            for (var i = 0; i < skinnedNodesLength; i++) {
                var skinnedNode = skinnedNodes[i];
                var nodeMeshes = skinnedNode.meshes;
                var nodeMeshesLength = nodeMeshes.length;
                for (var j = 0; j < nodeMeshesLength; j++) {
                    var meshId = nodeMeshes[j];
                    var mesh = meshes[meshId];
                    var primitives = mesh.primitives;
                    var primitivesLength = primitives.length;
                    for (var k = 0; k < primitivesLength; k++) {
                        var primitive = primitives[k];
                        jointCountForMaterialId[primitive.material] = jointCount;
                    }
                }
            }
        }
    }
    return jointCountForMaterialId;
}
