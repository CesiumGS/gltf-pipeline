'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedAnimationSamplers;

function removeUnusedAnimationSamplers(gltf, stats) {
    var animations = gltf.animations;

    // Remove unused samplers for each animation
    if (defined(animations)) {
        for (var animationId in animations) {
            if (animations.hasOwnProperty(animationId)) {
                var animation = animations[animationId];
                var usedSamplerIds = {};
                var channels = animation.channels;

                // Build hash of used samplers by iterating through channels
                if (defined(channels)) {
                    var length = channels.length;
                    for (var i = 0; i < length; i++) {
                        var id = channels[i].sampler;
                        usedSamplerIds[id] = true;
                    }
                }

                // Iterate through animation samplers and remove those that are not in the hash
                var numberOfAnimationSamplersRemoved = 0;
                var samplers = animation.samplers;
                if (defined(samplers)) {
                    var usedSamplers = {};

                    for (var samplerId in samplers) {
                        if (samplers.hasOwnProperty(samplerId)) {
                            // If this sampler is in the hash, then keep it in the glTF asset
                            if (defined(usedSamplerIds[samplerId])) {
                                usedSamplers[samplerId] = samplers[samplerId];
                            } else {
                                ++numberOfAnimationSamplersRemoved;
                            }
                        }
                    }

                    if (defined(stats)) {
                        stats.numberOfAnimationSamplersRemoved += numberOfAnimationSamplersRemoved;
                    }

                    animation.samplers = usedSamplers;
                }
            }
        }
    }

    return gltf;
}