'use strict';
var Cesium = require('cesium');
var deepEquals = require('deep-equal');

var defined = Cesium.defined;

var removeUnusedMaterials = require('./removeUnusedMaterials');

module.exports = mergeDuplicateMaterials;

function mergeDuplicateMaterials(gltf) {
    var materials = gltf.materials;
    var materialIdMapping = {};
    var uniqueMaterials = [];
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var uniqueMaterialsLength = uniqueMaterials.length;
            var unique = true;
            for (var i = 0; i < uniqueMaterialsLength; i++) {
                var uniqueMaterialId = uniqueMaterials[i];
                var uniqueMaterial = materials[uniqueMaterialId];
                if (deepEquals(material, uniqueMaterial)) {
                    materialIdMapping[materialId] = uniqueMaterialId;
                    unique = false;
                    break;
                }
            }
            if (unique) {
                uniqueMaterials.push(materialId);
            }
        }
    }
    remapMaterials(gltf, materialIdMapping);
    removeUnusedMaterials(gltf);
}

function remapMaterials(gltf, materialIdMapping) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var materialId = primitive.material;
                var mappedMaterialId = materialIdMapping[materialId];
                if (defined(mappedMaterialId)) {
                    primitive.material = mappedMaterialId;
                }
            }
        }
    }
}