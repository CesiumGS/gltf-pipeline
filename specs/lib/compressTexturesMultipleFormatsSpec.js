'use strict';
var compressTexturesMultipleFormats = require('../../lib/compressTexturesMultipleFormats');
var readGltf = require('../../lib/readGltf');

var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';

var defaultImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='; // 1x1 white png

describe('compressTexturesMultipleFormats', function() {
    beforeEach(function() {
        // Suppress console warnings that image is being resized
        spyOn(console, 'log');
    });

    it('compresses textures into multiple foramts', function(done) {
        var optionsArray = [{
            format : 'dxt1',
            quality : 5
        }, {
            format : 'astc',
            blockSize : '8x8'
        }];

        expect(readGltf(gltfEmbeddedPath)
            .then(function(gltf) {
                var images = gltf.images;
                var image = images.Image0001;
                expect(Object.keys(images).length).toBe(1);
                return compressTexturesMultipleFormats(gltf, optionsArray)
                    .then(function() {
                        var image = gltf.images.Image0001;
                        var compressedImageIds = image.extras.compressedImages3DTiles;
                        var s3tcImageId = compressedImageIds.s3tc;
                        var astcImageId = compressedImageIds.astc;
                        var s3tcImagePipelineExtras = gltf.images[s3tcImageId].extras._pipeline;
                        var astcImagePipelineExtras = gltf.images[astcImageId].extras._pipeline;
                        expect(image.uri).toBe(defaultImageUri);
                        expect(s3tcImageId).toBe('Image0001_s3tc');
                        expect(astcImageId).toBe('Image0001_astc');
                        expect(s3tcImagePipelineExtras.source).toBeDefined();
                        expect(s3tcImagePipelineExtras.extension).toEqual('.ktx');
                        expect(astcImagePipelineExtras.source).toBeDefined();
                        expect(astcImagePipelineExtras.extension).toEqual('.ktx');
                    });
            }), done).toResolve();
    });

    it('throws if optionsArray is undefined or length 0', function() {
        var gltf = {};
        expect(function() {
            compressTexturesMultipleFormats(gltf);
        }).toThrowDeveloperError();

        expect(function() {
            compressTexturesMultipleFormats(gltf, []);
        }).toThrowDeveloperError();
    });
});
