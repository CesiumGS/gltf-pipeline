'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedTextures;

function removeUnusedTextures(gltf, stats) {
    var usedTextureIds = {};
    var materials = gltf.materials;

    // Build hash of used textures by iterating through materials
    if (defined(materials)) {
        for (var materialId in materials) {
            if (materials.hasOwnProperty(materialId)) {
                if (defined(materials[materialId].values)) {
                    var values = materials[materialId].values;
                    for (var valueId in values) {
                        if (values.hasOwnProperty(valueId)) {
                            if (typeof values[valueId] === 'string') {
                                var id = values[valueId];
                                usedTextureIds[id] = true;
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