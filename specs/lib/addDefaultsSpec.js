'use strict';

var addDefaults = require('../../').addDefaults;

describe('addDefaults', function() {
    it('TODO', function() {
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

        addDefaults(gltf, undefined);
//        expect(gltf.images.unusedId).not.toBeDefined();
//        expect(stats.numberOfImagesRemoved).toEqual(1);
    });
});