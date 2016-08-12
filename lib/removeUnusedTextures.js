'use strict';
var Cesium = require('cesium');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = removeUnusedTextures;

/**
 * Remove all unused textures in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused textures.
 */
function removeUnusedTextures(gltf, stats) {
    var usedTextureIds = {};
    var materials = gltf.materials;
    var techniques = gltf.techniques;

    // Build hash of used textures by iterating through materials and techniques
    if (defined(materials)) {
        for (var materialId in materials) {
            if (materials.hasOwnProperty(materialId)) {
                if (defined(materials[materialId].values)) {
                    var values = materials[materialId].values;
                    for (var valueId in values) {
                        if (values.hasOwnProperty(valueId)) {
                            if (typeof values[valueId] === 'string') {
                                var materialTextureId = values[valueId];
                                usedTextureIds[materialTextureId] = true;
                            }
                        }
                    }
                }
            }
        }
    }
    if (defined(techniques)) {
        for (var techniqueId in techniques) {
            if (techniques.hasOwnProperty(techniqueId)) {
                if (defined(techniques[techniqueId].parameters)) {
                    var parameters = techniques[techniqueId].parameters;
                    for (var parameterId in parameters) {
                        if (parameters.hasOwnProperty(parameterId)) {
                            if (defined(parameters[parameterId].value)) {
                                var value = parameters[parameterId].value;
                                if (typeof value === 'string') {
                                    var techniqueTextureId = value;
                                    usedTextureIds[techniqueTextureId] = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return removeObject(gltf, 'textures', usedTextureIds, stats);
}