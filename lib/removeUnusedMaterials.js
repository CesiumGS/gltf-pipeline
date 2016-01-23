'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedMaterials;

function removeUnusedMaterials(gltf, stats) {
    var usedMaterialIds = {};
    var meshes = gltf.meshes;

    // Build hash of used materials by iterating through meshes
    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                if (defined(meshes[meshId].primitives)) {
                    var primitives = meshes[meshId].primitives;
                    var length = primitives.length;
                    for (var i = 0; i < length; i++) {
                        var id = primitives[i].material;
                        usedMaterialIds[id] = true;
                    }
                }
            }
        }
    }

    // Iterate through materials and remove those that are not in the hash
    var numberOfMaterialsRemoved = 0;
    var materials = gltf.materials;
    if (defined(materials)) {
        var usedMaterials = {};

        for (var materialId in materials) {
            if (materials.hasOwnProperty(materialId)) {
                // If this material is in the hash, then keep it in the glTF asset
                if (defined(usedMaterialIds[materialId])) {
                    usedMaterials[materialId] = materials[materialId];
                } else {
                    ++numberOfMaterialsRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfMaterialsRemoved += numberOfMaterialsRemoved;
        }

        gltf.materials = usedMaterials;
    }


    return gltf;
}