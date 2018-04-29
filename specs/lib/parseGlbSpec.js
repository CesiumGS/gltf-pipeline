'use strict';
var parseGlb = require('../../lib/parseGlb');
var removePipelineExtras = require('../../lib/removePipelineExtras');

describe('parseGlb', function() {
    it('throws an error with invalid magic', function() {
        var glb = Buffer.alloc(20);
        glb.write('NOPE', 0);
        expect(function() {
            parseGlb(glb);
        }).toThrowRuntimeError();
    });

    it('throws an error if version is not 1 or 2', function() {
        var glb = Buffer.alloc(20);
        glb.write('glTF', 0);
        glb.writeUInt32LE(3, 4);
        expect(function() {
            parseGlb(glb);
        }).toThrowRuntimeError();
    });

    describe('1.0', function() {
        it('throws an error if content format is not JSON', function() {
            var glb = Buffer.alloc(20);
            glb.write('glTF', 0);
            glb.writeUInt32LE(1, 4);
            glb.writeUInt32LE(20, 8);
            glb.writeUInt32LE(0, 12);
            glb.writeUInt32LE(1, 16);
            expect(function() {
                parseGlb(glb);
            }).toThrowRuntimeError();
        });

        it('loads binary glTF', function() {
            var binaryData = Buffer.from([0, 1, 2, 3, 4, 5]);
            var gltf = {
                bufferViews: {
                    imageBufferView: {
                        byteLength: 0
                    },
                    shaderBufferView: {
                        byteLength: 0
                    }
                },
                buffers: {
                    binary_glTF: {
                        byteLength: binaryData.length
                    }
                },
                images: {
                    image: {
                        extensions: {
                            KHR_binary_glTF: {
                                bufferView: 'imageBufferView',
                                mimeType: 'image/jpg'
                            }
                        }
                    }
                },
                shaders: {
                    shader: {
                        extensions: {
                            KHR_binary_glTF: {
                                bufferView: 'shaderBufferView'
                            }
                        }
                    }
                },
                extensionsUsed: ['KHR_binary_glTF']
            };
            var gltfString = JSON.stringify(gltf);
            while (gltfString.length % 4 !== 0) {
                gltfString += ' ';
            }
            var glb = Buffer.alloc(20 + gltfString.length + binaryData.length);
            glb.write('glTF', 0);
            glb.writeUInt32LE(1, 4);
            glb.writeUInt32LE(20 + gltfString.length + binaryData.length, 8);
            glb.writeUInt32LE(gltfString.length, 12);
            glb.writeUInt32LE(0, 16);
            glb.write(gltfString, 20);
            binaryData.copy(glb, 20 + gltfString.length);

            var parsedGltf = parseGlb(glb);
            expect(parsedGltf.extensionsUsed).toBeUndefined();
            var buffer = parsedGltf.buffers.binary_glTF;
            for (var i = 0; i < binaryData.length; i++) {
                expect(buffer.extras._pipeline.source[i]).toEqual(binaryData[i]);
            }

            var image = parsedGltf.images.image;
            expect(image.extensions.KHR_binary_glTF).toBeDefined();
            expect(image.extensions.KHR_binary_glTF.bufferView).toBe('imageBufferView');
            expect(image.extensions.KHR_binary_glTF.mimeType).toBe('image/jpg');
            var shader = parsedGltf.shaders.shader;
            expect(shader.extensions.KHR_binary_glTF).toBeDefined();
            expect(shader.extensions.KHR_binary_glTF.bufferView).toBe('shaderBufferView');
        });
    });

    describe('2.0', function() {
        it('loads binary glTF', function() {
            var i;
            var binaryData = Buffer.from([0, 1, 2, 3, 4, 5]);
            var gltf = {
                asset: {
                    version: '2.0'
                },
                buffers: [
                    {
                        byteLength: binaryData.length
                    }
                ],
                images: [
                    {
                        bufferView: 0,
                        mimeType: 'image/jpg'
                    }
                ]
            };
            var gltfString = JSON.stringify(gltf);
            while (gltfString.length % 4 !== 0) {
                gltfString += ' ';
            }
            var glb = Buffer.alloc(28 + gltfString.length + binaryData.length);
            glb.write('glTF', 0);
            glb.writeUInt32LE(2, 4);
            glb.writeUInt32LE(12 + 8 + gltfString.length + 8 + binaryData.length, 8);
            glb.writeUInt32LE(gltfString.length, 12);
            glb.writeUInt32LE(0x4E4F534A, 16);
            glb.write(gltfString, 20);
            glb.writeUInt32LE(binaryData.length, 20 + gltfString.length);
            glb.writeUInt32LE(0x004E4942, 24 + gltfString.length);
            binaryData.copy(glb, 28 + gltfString.length);

            var parsedGltf = parseGlb(glb);
            var buffer = parsedGltf.buffers[0];
            for (i = 0; i < binaryData.length; i++) {
                expect(buffer.extras._pipeline.source[i]).toEqual(binaryData[i]);
            }
            removePipelineExtras(parsedGltf);
            expect(parsedGltf).toEqual(gltf);
        });
    });
});
