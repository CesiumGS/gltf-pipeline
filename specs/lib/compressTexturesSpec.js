'use strict';
var Cesium = require('cesium');
var child_process = require('child_process');
var clone = require('clone');
var dataUriToBuffer = require('data-uri-to-buffer');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var compressTexture = require('../../lib/compressTexture');
var compressTextures = require('../../lib/compressTextures');
var directoryExists = require('../../lib/directoryExists');
var Pipeline = require('../../lib/Pipeline');
var readGltf = require('../../lib/readGltf');

var fsExtraReadJson = Promise.promisify(fsExtra.readJson);

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;

var basePath = './specs/data/boxTexturedUnoptimized/';
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';

// Defined relative to the gltf
var jpgPath = 'Cesium_Logo_Flat.jpg';
var jpegPath = 'Cesium_Logo_Flat.jpeg';
var pngPath = 'Cesium_Logo_Flat.png';
var gifPath = 'Cesium_Logo_Flat.gif';
var decalPath = 'Cesium_Logo_Flat_Decal.png'; // Contains alpha channel

var defaultImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='; // 1x1 white png

function compressGltfTexture(gltfPath, imagePath, options) {
    return fsExtraReadJson(gltfPath)
        .then(function(gltf) {
            var image = gltf.images.Image0001;
            if (defined(imagePath)) {
                image.uri = imagePath;
            }
            var pipelineOptions = {
                textureCompressionOptions : options,
                basePath : basePath
            };
            return Pipeline.processJSON(gltf, pipelineOptions)
                .then(function(gltf) {
                    // Return the first compressed image
                    var compressedImages = image.extras.compressedImage3DTiles;
                    return compressedImages[Object.keys(compressedImages)[0]].uri;
                });
        });
}

function verifyKTX(gltfPath, imagePath, options, expectedFormat) {
    return compressGltfTexture(gltfPath, imagePath, options)
        .then(function(uri) {
            var buffer = dataUriToBuffer(uri);
            var internalFormat = buffer.readUInt32LE(28);
            var width = buffer.readUInt32LE(36);
            var height = buffer.readUInt32LE(40);

            // Original image is 211x211. It will be shrunk to the lower power-of-two
            expect(width).toBe(128);
            expect(height).toBe(128);
            expect(internalFormat).toBe(expectedFormat);
            expect(uri.indexOf('image/ktx') >= 0).toBe(true);
        });
}

function verifyCrunch(gltfPath, imagePath, options) {
    return compressGltfTexture(gltfPath, imagePath, options)
        .then(function(uri) {
            expect(uri.indexOf('image/crn') >= 0).toBe(true);
        });
}

// etc2comp only supports png input so this is a good test case for handling different input image formats
var etc1Compression = {
    format : 'etc1'
};
var etc1Format = 0x8D64; // COMPRESSED_RGB_ETC1_WEBGL;

describe('compressTextures', function() {
    beforeEach(function() {
        // Suppress console warnings that image is being resized
        spyOn(console, 'log');
    });

    it('compresses external jpg', function(done) {
        expect(verifyKTX(gltfPath, jpgPath, etc1Compression, etc1Format), done).toResolve();
    });

    it('compresses external jpeg', function(done) {
        expect(verifyKTX(gltfPath, jpegPath, etc1Compression, etc1Format), done).toResolve();
    });

    it('compresses external png', function(done) {
        expect(verifyKTX(gltfPath, pngPath, etc1Compression, etc1Format), done).toResolve();
    });

    it('throws when compressing external gif', function(done) {
        // gif files cannot be decoded with Jimp and are not accepted by most compress tools
        expect(verifyKTX(gltfPath, gifPath, etc1Compression, etc1Format), done).toRejectWith(DeveloperError);
    });

    it('compresses embedded png', function(done) {
        expect(verifyKTX(gltfEmbeddedPath, undefined, etc1Compression, etc1Format), done).toResolve();
    });

    it('throws with undefined gltf', function() {
        expect(function() {
            compressTextures();
        }).toThrowDeveloperError();
    });

    it('throws with undefined format', function() {
        var gltf = {};
        expect(function() {
            compressTexture(gltf, 'Image0001');
        }).toThrowDeveloperError();
    });

    it('throws with invalid format', function() {
        var gltf = {};
        var options = {
            format : 'invalid-format'
        };
        expect(function() {
            compressTexture(gltf, 'Image0001', options);
        }).toThrowDeveloperError();
    });

    it('throws with invalid quality', function() {
        var gltf = {};
        var options = {
            format : 'etc1',
            quality : 11
        };
        expect(function() {
            compressTexture(gltf, 'Image0001', options);
        }).toThrowDeveloperError();
    });

    it('throws with invalid pvrtc bitrate', function() {
        var gltf = {};
        var options = {
            format : 'pvrtc1',
            bitrate : 3.0
        };
        expect(function() {
            compressTexture(gltf, 'Image0001', options);
        }).toThrowDeveloperError();
    });

    it('throws with invalid astc block size', function() {
        var gltf = {};
        var options = {
            format : 'astc',
            blockSize : '1x1'
        };
        expect(function() {
            compressTexture(gltf, 'Image0001', options);
        }).toThrowDeveloperError();
    });

    it('pvrtc1 2bpp RGBA', function(done) {
        var options = {
            format : 'pvrtc1',
            bitrate : 2.0
        };
        var expectedFormat = 0x8C03; // COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
        expect(verifyKTX(gltfPath, decalPath, options, expectedFormat), done).toResolve();
    });

    it('pvrtc1 4bpp RGBA', function(done) {
        var options = {
            format : 'pvrtc1',
            bitrate : 4.0
        };
        var expectedFormat = 0x8C02; // COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        expect(verifyKTX(gltfPath, decalPath, options, expectedFormat), done).toResolve();
    });

    it('pvrtc1 2bpp RGB', function(done) {
        var options = {
            format : 'pvrtc1',
            bitrate : 2.0
        };
        var expectedFormat = 0x8C01; // COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('pvrtc1 4bpp RGB', function(done) {
        var options = {
            format : 'pvrtc1',
            bitrate : 4.0
        };
        var expectedFormat = 0x8C00; // COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('pvrtc2 2bpp', function(done) {
        var options = {
            format : 'pvrtc2',
            bitrate : 2.0
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x9137; // COMPRESSED_RGBA_PVRTC_2BPPV2_IMG
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('pvrtc2 4bpp', function(done) {
        var options = {
            format : 'pvrtc2',
            bitrate : 4.0
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x9138; // COMPRESSED_RGBA_PVRTC_4BPPV2_IMG
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('etc1', function(done) {
        var options = {
            format : 'etc1'
        };

        var expectedFormat = 0x8D64; // COMPRESSED_RGB_ETC1_WEBGL;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('etc2 RGB', function(done) {
        var options = {
            format : 'etc2'
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x9274; // COMPRESSED_RGB8_ETC2
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('etc2 RGBA', function(done) {
        var options = {
            format : 'etc2'
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x9278; // COMPRESSED_RGBA8_ETC2_EAC
        expect(verifyKTX(gltfPath, decalPath, options, expectedFormat), done).toResolve();
    });

    it('etc2 RGB+A', function(done) {
        var options = {
            format : 'etc2',
            alphaBit : true
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x9276; // COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2
        expect(verifyKTX(gltfPath, decalPath, options, expectedFormat), done).toResolve();
    });

    it('dxt1 RGB', function(done) {
        var options = {
            format : 'dxt1'
        };

        var expectedFormat = 0x83F0; // COMPRESSED_RGB_S3TC_DXT1_EXT;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('dxt1 RGBA', function(done) {
        var options = {
            format : 'dxt1'
        };

        var expectedFormat = 0x83F1; // COMPRESSED_RGBA_S3TC_DXT1_EXT;
        expect(verifyKTX(gltfPath, decalPath, options, expectedFormat), done).toResolve();
    });

    it('dxt3', function(done) {
        var options = {
            format : 'dxt3'
        };

        var expectedFormat = 0x83F2; // COMPRESSED_RGBA_S3TC_DXT3_EXT;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('dxt5', function(done) {
        var options = {
            format : 'dxt5'
        };

        var expectedFormat = 0x83F3; // COMPRESSED_RGBA_S3TC_DXT5_EXT;
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('crunch-dxt1', function(done) {
        var options = {
            format : 'crunch-dxt1'
        };

        expect(verifyCrunch(gltfPath, pngPath, options), done).toResolve();
    });

    it('crunch-dxt5', function(done) {
        var options = {
            format : 'crunch-dxt5'
        };

        expect(verifyCrunch(gltfPath, pngPath, options), done).toResolve();
    });

    it('astc', function(done) {
        // Check all possible ASTC formats. These are not supported by WebGL currently.
        //
        // COMPRESSED_RGBA_ASTC_4x4_KHR            0x93B0
        // COMPRESSED_RGBA_ASTC_5x4_KHR            0x93B1
        // COMPRESSED_RGBA_ASTC_5x5_KHR            0x93B2
        // COMPRESSED_RGBA_ASTC_6x5_KHR            0x93B3
        // COMPRESSED_RGBA_ASTC_6x6_KHR            0x93B4
        // COMPRESSED_RGBA_ASTC_8x5_KHR            0x93B5
        // COMPRESSED_RGBA_ASTC_8x6_KHR            0x93B6
        // COMPRESSED_RGBA_ASTC_8x8_KHR            0x93B7
        // COMPRESSED_RGBA_ASTC_10x5_KHR           0x93B8
        // COMPRESSED_RGBA_ASTC_10x6_KHR           0x93B9
        // COMPRESSED_RGBA_ASTC_10x8_KHR           0x93BA
        // COMPRESSED_RGBA_ASTC_10x10_KHR          0x93BB
        // COMPRESSED_RGBA_ASTC_12x10_KHR          0x93BC
        // COMPRESSED_RGBA_ASTC_12x12_KHR          0x93BD

        var blockSizes = ['4x4', '5x4', '5x5', '6x5', '6x6', '8x5', '8x6', '8x8', '10x5', '10x6', '10x8', '10x10', '12x10', '12x12'];
        var options = {
            format : 'astc'
        };

        var promises = [];
        var length = blockSizes.length;
        for (var i = 0; i < length; ++i) {
            options = clone(options);
            options.blockSize = blockSizes[i];
            var expectedFormat = 0x93B0 + i;
            promises.push(verifyKTX(gltfPath, pngPath, options, expectedFormat));
        }
        expect(Promise.all(promises), done).toResolve();
    });

    it('astc low bitrate', function(done) {
        // Bitrate of 2.0 corresponds to block size of 8x8
        var options = {
            format : 'astc',
            bitrate : 2.0
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x93B7; // COMPRESSED_RGBA_ASTC_8x8_KHR
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('astc high bitrate', function(done) {
        // Bitrate of 8.0 corresponds to block size of 4x4
        var options = {
            format : 'astc',
            bitrate : 8.0
        };

        // Format is not supported by WebGL currently
        var expectedFormat = 0x93B0; // COMPRESSED_RGBA_ASTC_4x4_KHR
        expect(verifyKTX(gltfPath, pngPath, options, expectedFormat), done).toResolve();
    });

    it('sets quality', function(done) {
        var formats = ['pvrtc1', 'pvrtc2', 'etc1', 'etc2', 'astc', 'dxt1', 'dxt3', 'dxt5', 'crunch-dxt1', 'crunch-dxt5'];
        var promises = [];
        var length = formats.length;

        function compareUris(uris) {
            expect(uris[0]).not.toEqual(uris[1]);
        }

        // For each texture format encode at low and medium quality and compare results
        for (var i = 0; i < length; ++i) {
            var format = formats[i];
            var lowQuality = {
                format : format,
                quality : 1
            };
            var highQuality = {
                format : format,
                quality : 5
            };
            promises.push(Promise.all([
                compressGltfTexture(gltfPath, pngPath, lowQuality),
                compressGltfTexture(gltfPath, pngPath, highQuality)
            ]).then(compareUris));
        }

        expect(Promise.all(promises), done).toResolve();
    });

    it('tempDirectory is removed when compression succeeds', function(done) {
        spyOn(fsExtra, 'writeFileAsync').and.callThrough();
        expect(verifyKTX(gltfPath, undefined, etc1Compression, etc1Format)
            .then(function() {
                var tempDirectory = path.dirname(fsExtra.writeFileAsync.calls.argsFor(0)[0]);
                return directoryExists(tempDirectory)
                    .then(function(exists) {
                        expect(exists).toBe(false);
                    });
            }), done).toResolve();
    });

    it('tempDirectory is removed when compression fails', function(done) {
        var childProcessSpawn = child_process.spawn;
        spyOn(fsExtra, 'writeFileAsync').and.callThrough();
        spyOn(child_process, 'spawn').and.callFake(function(command, args) {
            // Trigger a failure by sending in an invalid argument to the compress tool
            args.push('invalid_arg');
            return childProcessSpawn(command, args);
        });
        expect(verifyKTX(gltfPath, undefined, etc1Compression, etc1Format)
            .then(function() {
                var tempDirectory = path.dirname(fsExtra.writeFileAsync.calls.argsFor(0)[0]);
                return directoryExists(tempDirectory)
                    .then(function(exists) {
                        expect(exists).toBe(false);
                    });
            }), done).toRejectWith(DeveloperError);
    });

    it('sets sampler minFilter to a non-mipmap format', function(done) {
        var options = {
            format : 'etc1'
        };
        expect(fsExtraReadJson(gltfPath)
            .then(function(gltf) {
                var sampler = gltf.samplers.sampler_0;
                expect(sampler.minFilter).toBe(WebGLConstants.LINEAR_MIPMAP_LINEAR);
                var pipelineOptions = {
                    textureCompressionOptions : options,
                    basePath : basePath
                };
                return Pipeline.processJSON(gltf, pipelineOptions)
                    .then(function() {
                        expect(sampler.minFilter).toBe(WebGLConstants.LINEAR);
                    });
            }), done).toResolve();
    });

    it('compresses textures into multiple formats', function(done) {
        var optionsArray = [{
            format : 'dxt1',
            quality : 5
        }, {
            format : 'astc',
            blockSize : '8x8'
        }, {
            format : 'crunch-dxt1',
            quality : 5
        }];

        expect(readGltf(gltfEmbeddedPath)
            .then(function(gltf) {
                var images = gltf.images;
                expect(Object.keys(images).length).toBe(1);
                return compressTextures(gltf, optionsArray)
                    .then(function() {
                        var image = gltf.images.Image0001;
                        var compressedImages = image.extras.compressedImage3DTiles;
                        var s3tcImagePipelineExtras = compressedImages.s3tc.extras._pipeline;
                        var astcImagePipelineExtras = compressedImages.astc.extras._pipeline;
                        var crunchImagePipelineExtras = compressedImages.crunch.extras._pipeline;
                        expect(image.uri).toBe(defaultImageUri);
                        expect(s3tcImagePipelineExtras.source).toBeDefined();
                        expect(s3tcImagePipelineExtras.extension).toEqual('.ktx');
                        expect(astcImagePipelineExtras.source).toBeDefined();
                        expect(astcImagePipelineExtras.extension).toEqual('.ktx');
                        expect(crunchImagePipelineExtras.source).toBeDefined();
                        expect(crunchImagePipelineExtras.extension).toEqual('.crn');

                    });
            }), done).toResolve();
    });

    it('throws if optionsArray is undefined or length 0', function() {
        var gltf = {};
        expect(function() {
            compressTextures(gltf);
        }).toThrowDeveloperError();

        expect(function() {
            compressTextures(gltf, []);
        }).toThrowDeveloperError();
    });
});
