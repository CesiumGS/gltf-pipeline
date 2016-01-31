'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedSamplers;

function removeUnusedSamplers(gltf, stats) {
    var usedSamplerIds = {};
    var textures = gltf.textures;

    // Build hash of used samplers by iterating through textures
    if (defined(textures)) {
        for (var textureId in textures) {
            if (textures.hasOwnProperty(textureId)) {
                var id = textures[textureId].sampler;
                usedSamplerIds[id] = true;
            }
        }
    }

    return removeObject(gltf, 'samplers', usedSamplerIds, stats);
}