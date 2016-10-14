'use strict';
var Cesium = require('cesium');
var getPrimitiveAttributeSemantics = require('./getPrimitiveAttributeSemantics');

var defined = Cesium.defined;

module.exports = removeNormals;

/**
 * Removes normals from primitives. The technique is stripped off of the primitive's material so that
 * it can be regenerated.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed normals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function removeNormals(gltf) {
    var materials = gltf.materials;
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                if(removePrimitiveNormals(primitive)) {
                    var materialId = primitive.material;
                    if (defined(materialId)) {
                        var material = materials[materialId];
                        if (defined(material.technique)) {
                            delete material.technique;
                        }
                    }
                }
            }
        }
    }
}

function removePrimitiveNormals(primitive) {
    var removedNormals = false;
    var normalSemantics = getPrimitiveAttributeSemantics(primitive, 'NORMAL');
    var normalSemanticsLength = normalSemantics.length;
    if (normalSemanticsLength > 0) {
        for (var i = 0; i < normalSemanticsLength; i++) {
            var normalSemantic = normalSemantics[i];
            delete primitive.attributes[normalSemantic];
            removedNormals = true;
        }
    }
    return removedNormals;
}