'use strict';
var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');

var defaultValue = Cesium.defaultValue;
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
 * @returns {Object} The glTF asset using the KHR_materials_common extension.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateModelMaterialsCommon(gltf, kmcOptions) {
    kmcOptions = defaultValue(kmcOptions, {});
    kmcOptions.doubleSided = defaultValue(kmcOptions.doubleSided, false);
    kmcOptions.technique = defaultValue(kmcOptions.technique, 'PHONG');
    addExtensionsUsed(gltf, 'KHR_materials_common');
    var materialsCommon;
    var materials = gltf.materials;
    var nodes = gltf.nodes;
    var techniques = gltf.techniques;
    var jointCountForMaterialId = getJointCountForMaterials(gltf);

    var gltfExtensions = gltf.extensions;
    if (!defined(gltfExtensions)) {
        gltfExtensions = {};
        gltf.extensions = gltfExtensions;
    }
    materialsCommon = {};
    gltfExtensions.KHR_materials_common = materialsCommon;
    var lights = {};
    materialsCommon.lights = lights;

    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var technique = techniques[material.technique];
            var techniqueParameters = technique.parameters;
            if (defined(techniqueParameters.ambient) && !defined(lights.defaultAmbient)) {
                lights.defaultAmbient = {
                    ambient: {
                        color: [1, 1, 1]
                    },
                    name: 'defaultAmbient',
                    type: 'ambient'
                };
            }
            for (var parameterId in techniqueParameters) {
                if (techniqueParameters.hasOwnProperty(parameterId)) {
                    if (parameterId.indexOf('light') === 0 && parameterId.indexOf('Transform') >= 0) {
                        var lightId = parameterId.substring(0, parameterId.indexOf('Transform'));
                        var lightTransform = techniqueParameters[parameterId];
                        var lightNodeId = lightTransform.node;
                        var lightNode = nodes[lightNodeId];
                        var nodeExtensions = lightNode.extensions;
                        if (!defined(nodeExtensions)) {
                            nodeExtensions = {};
                            lightNode.extensions = nodeExtensions;
                        }
                        materialsCommon = {};
                        nodeExtensions.KHR_materials_common = materialsCommon;
                        materialsCommon.light = lightId;
                        var lightColor = techniqueParameters[lightId + 'Color'];
                        var light = {
                            name: lightId,
                            type: 'directional',
                            directional: {
                                color: defaultValue(lightColor.value, [1, 1, 1])
                            }
                        };
                        lights[lightId] = light;
                    }
                }
            }

            delete material.technique;
            var extensions = material.extensions;
            if (!defined(extensions)) {
                extensions = {};
                material.extensions = extensions;
            }
            materialsCommon = {};
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

            var materialValues = material.values;
            var diffuseColor, transparency;
            if (defined(materialValues)) {
                diffuseColor = materialValues.diffuse;
                transparency = materialValues.transparency;
                materialsCommon.values = materialValues;
            }

            // Check if we have transparency and set transparent flag
            if ((defined(transparency) && transparency < 1.0) ||
                (defined(diffuseColor) && Array.isArray(diffuseColor) && diffuseColor[3] < 1.0)) {
                materialsCommon.values.transparent = true;
            } else if (typeof diffuseColor === 'string') {
                materialsCommon.values.transparent = gltf.images[gltf.textures[diffuseColor].source].extras._pipeline.transparent;
            }
            delete material.values;
        }
    }
    delete gltf.techniques;
    delete gltf.programs;
    delete gltf.shaders;
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
