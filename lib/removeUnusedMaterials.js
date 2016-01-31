'use strict';
var removeObject = require('./removeObject');
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

    return removeObject(gltf, 'materials', usedMaterialIds, stats);
}