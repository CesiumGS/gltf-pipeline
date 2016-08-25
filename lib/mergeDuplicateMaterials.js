'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var deepEqual = require('deep-equal');
var removeUnusedMaterials = require('./RemoveUnusedProperties').removeUnusedMaterials;

var defined = Cesium.defined;

module.exports = mergeDuplicateMaterials;

function mergeDuplicateMaterials(gltf) {
    var materials = gltf.materials;
    var materialIdMapping = {};
    var uniqueMaterials = [];
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = clone(materials[materialId]);
            delete material.name;
            delete material.extras;
            var uniqueMaterialsLength = uniqueMaterials.length;
            var unique = true;
            for (var i = 0; i < uniqueMaterialsLength; i++) {
                var uniqueMaterialId = uniqueMaterials[i];
                var uniqueMaterial = materials[uniqueMaterialId];
                if (deepEqual(material, uniqueMaterial)) {
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