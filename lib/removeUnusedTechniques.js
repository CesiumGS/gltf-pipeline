'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedTechniques;

function removeUnusedTechniques(gltf, stats) {
    var usedTechniqueIds = {};
    var materials = gltf.materials;

    // Build hash of used techniques by iterating through materials
    if (defined(materials)) {
        for (var materialId in materials) {
            if (materials.hasOwnProperty(materialId)) {
                if (defined(materials[materialId].technique)) {
                    var id = materials[materialId].technique;
                    usedTechniqueIds[id] = true;
                }
            }
        }
    }

    return removeObject(gltf, 'techniques', usedTechniqueIds, stats);
}