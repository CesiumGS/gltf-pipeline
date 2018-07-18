'use strict';

var removeObject = require('../../lib/removeObject');

describe('removeObject', function() {
    it('removes an object', function() {
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
        gltf = removeObject(gltf, 'samplers', { sampler_0 : true });
        expect(gltf.samplers.unusedSamplerId).not.toBeDefined();
        expect(Object.keys(gltf.samplers).length).toEqual(1);
    });

    it('does not remove any objects', function() {
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
        gltf = removeObject(gltf, 'samplers', { sampler_0 : true });
        expect(gltf.samplers.sampler_0).toBeDefined();
        expect(Object.keys(gltf.samplers).length).toEqual(1);
    });
});
