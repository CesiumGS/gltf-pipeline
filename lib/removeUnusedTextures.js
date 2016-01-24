'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedTextures;

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

    // Iterate through textures and remove those that are not in the hash
    var numberOfTexturesRemoved = 0;
    var textures = gltf.textures;
    if (defined(textures)) {
        var usedTextures = {};

        for (var textureId in textures) {
            if (textures.hasOwnProperty(textureId)) {
                // If this texture is in the hash, then keep it in the glTF asset
                if (defined(usedTextureIds[textureId])) {
                    usedTextures[textureId] = textures[textureId];
                } else {
                    ++numberOfTexturesRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfTexturesRemoved += numberOfTexturesRemoved;
        }

        gltf.textures = usedTextures;
    }


    return gltf;
}