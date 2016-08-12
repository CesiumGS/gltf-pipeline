'use strict';
var Cesium = require('cesium');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = removeUnusedMaterials;

/**
 * Remove all unused materials in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused images.
 */
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