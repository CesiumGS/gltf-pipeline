'use strict';
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

    // Iterate through samplers and remove those that are not in the hash
    var numberOfSamplersRemoved = 0;
    var samplers = gltf.samplers;
    if (defined(samplers)) {
        var usedSamplers = {};

        for (var samplerId in samplers) {
            if (samplers.hasOwnProperty(samplerId)) {
                // If this sampler is in the hash, then keep it in the glTF asset
                if (defined(usedSamplerIds[samplerId])) {
                    usedSamplers[samplerId] = samplers[samplerId];
                } else {
                    ++numberOfSamplersRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfSamplersRemoved += numberOfSamplersRemoved;
        }

        gltf.samplers = usedSamplers;
    }

    return gltf;
}