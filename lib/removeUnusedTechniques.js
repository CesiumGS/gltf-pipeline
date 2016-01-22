'use strict';
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
                if(defined(materials[materialId].technique)){
                    var id = materials[materialId].technique;
                    usedTechniqueIds[id] = true;
                }
            }
        }
    }

    // Iterate through techniques and remove those that are not in the hash
    var numberOfTechniquesRemoved = 0;
    var techniques = gltf.techniques; 
    if (defined(techniques)) {
        var usedTechniques = {};

        for (var techniqueId in techniques) {
            if (techniques.hasOwnProperty(techniqueId)) {
                // If this technique is in the hash, then keep it in the glTF asset
                if (defined(usedTechniqueIds[techniqueId])) {
                    usedTechniques[techniqueId] = techniques[techniqueId];
                } else {
                    ++numberOfTechniquesRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfTechniquesRemoved += numberOfTechniquesRemoved;
        }

        gltf.techniques = usedTechniques;
    }
    

    return gltf;
}