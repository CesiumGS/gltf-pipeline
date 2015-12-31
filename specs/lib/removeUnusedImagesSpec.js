'use strict';

var removeUnusedImages = require('../../').removeUnusedImages;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedImages', function() {
    it('removes an image', function() {
        var gltf = {
            "images": {
                "Image0001": {
                    "name": "Image0001",
                    "uri": "Cesium_Logo_Flat.png"
                },
                "unusedId": {
                    "name": "An unused image for testing removal",
                    "uri": "unused.png"
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
        removeUnusedImages(gltf, stats);
        expect(gltf.images.unusedId).not.toBeDefined();
        expect(stats.numberOfImagesRemoved).toEqual(1);
    });

    it('does not remove any images', function() {
        var gltf = {
            "images": {
                "Image0001": {
                    "name": "Image0001",
                    "uri": "Cesium_Logo_Flat.png"
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
        removeUnusedImages(gltf, stats);
        expect(gltf.images.Image0001).toBeDefined();
        expect(stats.numberOfImagesRemoved).toEqual(0);
    });
});