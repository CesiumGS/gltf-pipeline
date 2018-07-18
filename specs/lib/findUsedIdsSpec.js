'use strict';

var findUsedIds = require('../../lib/findUsedIds');

describe('findUsedIds', function() {
    it('finds used ids', function() {
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

        var usedSamplerIds = findUsedIds(gltf, 'textures', 'sampler');
        expect(usedSamplerIds).toEqual({
            sampler_0 : true
        });
    });
});
