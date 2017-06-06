'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var addExtensionsUsed = require('./addExtensionsUsed');
var getPrimitiveAttributeSemantics = require('./getPrimitiveAttributeSemantics');
var getUniqueId = require('./getUniqueId');
var processModelMaterialsCommon = require('./processModelMaterialsCommon');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = removeNormals;

/**
 * Removes normals from primitives. The material is regenerated to use constant lighting.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Options passed to processModelMaterialsCommon.
 * @returns {Object} The glTF asset with removed normals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function removeNormals(gltf, options) {
    var generatedMaterials = {};
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                if (removePrimitiveNormals(primitive)) {
                    generateMaterial(gltf, primitive, generatedMaterials);
                }
            }
        }
    }
    if (Object.keys(generatedMaterials).length > 0) {
        processModelMaterialsCommon(gltf, options);
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

function generateMaterial(gltf, primitive, generatedMaterials) {
    gltf.materials = defaultValue(gltf.materials, {});
    var materials = gltf.materials;
    var materialId = primitive.material;
    var material = materials[materialId];

    var generatedMaterialId = generatedMaterials[materialId];
    if (defined(generatedMaterialId)) {
        primitive.material = generatedMaterialId;
        return;
    }

    addExtensionsUsed(gltf, 'KHR_materials_common');
    generatedMaterialId = getUniqueId(gltf, materialId);

    var values = [];
    if (defined(material)) {
        values = defaultValue(clone(material.values), []);
    }

    gltf.materials[generatedMaterialId] = {
        extensions : {
            KHR_materials_common : {
                technique : 'CONSTANT',
                values : values,
                extras: {
                    _pipeline: {}
                }
            }
        }
    };
    primitive.material = generatedMaterialId;
    generatedMaterials[materialId] = generatedMaterialId;
}
