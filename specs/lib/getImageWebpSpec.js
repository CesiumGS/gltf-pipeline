'use strict';
const getImageWebp = require('../../lib/getImageWebp');

describe('getImageWebp', function() {
    it('returns WebP image object only when defined.', function() {
        const gltf = {
            asset: {
                version: '2.0'
            },
            images: [
                {
                  uri: "image.png",
                  extensions: {
                      EXT_image_webp: {
                        uri: "image.webp"
                      }
                    }
                },
                {
                    uri: "image2.png"
                }
            ]
        };

        expect(getImageWebp(gltf.images[0]).uri).toBe("image.webp");
        expect(getImageWebp(gltf.images[1])).toBeUndefined();
    });
});
