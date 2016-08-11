'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = removeUnusedPrimitiveAttributes;

/**
 * Removes references to primitive attributes that aren't defined in the material's technique.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused primitive attributes.
 */
function removeUnusedPrimitiveAttributes(gltf) {
    var meshes = gltf.meshes;
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var materialId = primitive.material;
                var material = materials[materialId];
                var techniqueId = material.technique;
                var technique = techniques[techniqueId];
                var techniqueParameters = technique.parameters;
                var attributes = primitive.attributes;
                var usedAttributes = {};
                for (var attributeSemantic in attributes) {
                    if (attributes.hasOwnProperty(attributeSemantic)) {
                        usedAttributes[attributeSemantic] = false;
                    }
                }
                for (var techniqueParameter in techniqueParameters) {
                    if (techniqueParameters.hasOwnProperty(techniqueParameter)) {
                        var parameterProperties = techniqueParameters[techniqueParameter];
                        var parameterSemantic = parameterProperties.semantic;
                        if (defined(parameterSemantic)) {
                            usedAttributes[parameterSemantic] = true;
                        }
                    }
                }
                for (var attribute in usedAttributes) {
                    if (usedAttributes.hasOwnProperty(attribute)) {
                        if (!usedAttributes[attribute]) {
                            delete attributes[attribute];
                        }
                    }
                }
            }
        }
    }
    return gltf;
}