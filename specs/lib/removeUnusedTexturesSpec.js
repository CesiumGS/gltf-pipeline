'use strict';

var removeUnusedTextures = require('../../').removeUnusedTextures;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedTextures', function() {
    it('removes a texture', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256,
                        "specular": [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
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
                },
                "unusedTextureId": {
                    "sampler": "sampler_0",
                    "source": "Image0001"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedTextures(gltf, stats);
        expect(gltf.textures.unusedTextureId).not.toBeDefined();
        expect(stats.numberOfTexturesRemoved).toEqual(1);
    });

    it('does not remove any textures', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256,
                        "specular": [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
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
        removeUnusedTextures(gltf, stats);
        expect(gltf.textures.texture_Image0001).toBeDefined();
        expect(stats.numberOfTexturesRemoved).toEqual(0);
    });
});