'use strict';
var Cesium = require('cesium');
var deepEqual = require('deep-equal');

var defined = Cesium.defined;

var removeUnusedTechniques = require('./removeUnusedTechniques');

module.exports = mergeDuplicateTechniques;

function mergeDuplicateTechniques(gltf) {
    var techniques = gltf.techniques;
    var techniqueIdMapping = {};
    var uniqueTechniques = [];
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var uniqueTechniquesLength = uniqueTechniques.length;
            var unique = true;
            for (var i = 0; i < uniqueTechniquesLength; i++) {
                var uniqueTechniqueId = uniqueTechniques[i];
                var uniqueTechnique = techniques[uniqueTechniqueId];
                if (deepEqual(technique, uniqueTechnique)) {
                    techniqueIdMapping[techniqueId] = uniqueTechniqueId;
                    unique = false;
                    break;
                }
            }
            if (unique) {
                uniqueTechniques.push(techniqueId);
            }
        }
    }
    remapTechniques(gltf,techniqueIdMapping);
    removeUnusedTechniques(gltf);
}

function remapTechniques(gltf, techniqueIdMapping) {
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var techniqueId = material.technique;
            var mappedTechniqueId = techniqueIdMapping[techniqueId];
            if (defined(mappedTechniqueId)) {
                material.technique = mappedTechniqueId;
            }
        }
    }
}