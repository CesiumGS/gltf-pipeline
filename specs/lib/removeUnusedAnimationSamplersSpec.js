'use strict';

var removeUnusedAnimationSamplers = require('../../').removeUnusedAnimationSamplers;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedAnimationSamplers', function() {
    it('removes an animation sampler', function() {
        var gltf = {
            "animations": {
                "animation_0": {
                    "channels": [
                        {
                            "sampler": "animation_0_translation_sampler",
                            "target": {
                                "id": "Bone",
                                "path": "translation"
                            }
                        }
                    ],
                    "samplers": {
                        "animation_0_translation_sampler": {
                            "input": "TIME",
                            "output": "translation"
                        },
                        "unusedAnimationSamplerId": {
                            "input": "TIME",
                            "output": "translation"
                        }
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedAnimationSamplers(gltf, stats);
        expect(gltf.animations.animation_0.samplers.unusedAnimationSamplerId).not.toBeDefined();
        expect(stats.numberOfAnimationSamplersRemoved).toEqual(1);
    });

    it('does not remove any animation samplers', function() {
        var gltf = {
            "animations": {
                "animation_0": {
                    "channels": [
                        {
                            "sampler": "animation_0_translation_sampler",
                            "target": {
                                "id": "Bone",
                                "path": "translation"
                            }
                        }
                    ],
                    "samplers": {
                        "animation_0_translation_sampler": {
                            "input": "TIME",
                            "output": "translation"
                        }
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedAnimationSamplers(gltf, stats);
        expect(gltf.animations.animation_0.samplers.animation_0_translation_sampler).toBeDefined();
        expect(stats.numberOfAnimationSamplersRemoved).toEqual(0);
    });
});