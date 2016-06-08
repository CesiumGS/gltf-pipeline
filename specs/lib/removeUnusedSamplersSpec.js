'use strict';

var removeUnusedSamplers = require('../../lib/removeUnusedSamplers');
var OptimizationStatistics = require('../../lib/OptimizationStatistics');

describe('removeUnusedSamplers', function() {
    it('removes a sampler', function() {
        var gltf = {
            "samplers": {
                "sampler_0": {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                },
                "unusedSamplerId": {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            },
            "textures": {
                "texture_Image0001": {
                    "format": 6408,
                    "internalFormat": 6408,
                    "sampler": "sampler_0",
                    "source": "Image0001",
                    "target": 3553,
                    "type": 5121
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSamplers(gltf, stats);
        expect(gltf.samplers.unusedSamplerId).not.toBeDefined();
        expect(stats.numberRemoved.samplers).toEqual(1);
    });

    it('does not remove any samplers', function() {
        var gltf = {
            "samplers": {
                "sampler_0": {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            },
            "textures": {
                "texture_Image0001": {
                    "format": 6408,
                    "internalFormat": 6408,
                    "sampler": "sampler_0",
                    "source": "Image0001",
                    "target": 3553,
                    "type": 5121
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSamplers(gltf, stats);
        expect(gltf.samplers.sampler_0).toBeDefined();
        expect(stats.numberRemoved.samplers).toEqual(0);
    });
});