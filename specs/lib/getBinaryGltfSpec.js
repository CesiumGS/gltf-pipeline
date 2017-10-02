'use strict';
var getBinaryGltf = require('../../lib/getBinaryGltf');
var parseBinaryGltf = require('../../lib/parseBinaryGltf');

describe('getBinaryGltf', function() {
    it('writes a binary glTF with embedded resources', function () {
        var shaderText = "testing shader";
        var imageText = "testing image";
        var gltf = {
            images: [{
                extras: {
                    _pipeline: {
                        source: Buffer.from(imageText),
                        extension: '.png'
                    }
                }
            }],
            shaders: [{
                extras: {
                    _pipeline: {
                        source: Buffer.from(shaderText)
                    }
                }
            }]
        };
        var glb = getBinaryGltf(gltf);
        var parsedGltf = parseBinaryGltf(glb);
        var buffer = parsedGltf.buffers[0];
        var source = buffer.extras._pipeline.source;
        var shader = parsedGltf.shaders[0];
        var image = parsedGltf.images[0];
        var shaderBufferView = parsedGltf.bufferViews[shader.bufferView];
        var imageBufferView = parsedGltf.bufferViews[image.bufferView];
        var testShaderText = Buffer.from(source.slice(shaderBufferView.byteOffset, shaderBufferView.byteOffset + shaderBufferView.byteLength)).toString();
        var testImageText = Buffer.from(source.slice(imageBufferView.byteOffset, imageBufferView.byteOffset + imageBufferView.byteLength)).toString();
        expect(testShaderText).toEqual(shaderText);
        expect(testImageText).toEqual(imageText);
        expect(image.mimeType).toEqual('image/png');
    });

    it('writes a binary glTF with embedded shaders and separate images', function() {
        var shaderText = "testing shader";
        var imageText = "testing image";
        var gltf = {
            images: [{
                uri: shaderText
            }],
            shaders: [{
                extras: {
                    _pipeline: {
                        source: Buffer.from(shaderText)
                    }
                }
            }]
        };
        var glb = getBinaryGltf(gltf, {
            embedImage: false
        });
        var parsedGltf = parseBinaryGltf(glb);
        var buffer = parsedGltf.buffers[0];
        var source = buffer.extras._pipeline.source;
        var shader = parsedGltf.shaders[0];
        var shaderBufferView = parsedGltf.bufferViews[shader.bufferView];
        var image = parsedGltf.images[0];
        expect(image.bufferView).not.toBeDefined();
        var testShaderText = Buffer.from(source.slice(shaderBufferView.byteOffset, shaderBufferView.byteOffset + shaderBufferView.byteLength)).toString();
        expect(testShaderText).toEqual(shaderText);
        expect(image.uri).toEqual(shaderText);
    });

    it('writes a binary glTF with separate shaders and embedded images', function() {
        var shaderText = "testing shader";
        var imageText = "testing image";
        var gltf = {
            images: [{
                extras: {
                    _pipeline: {
                        source: Buffer.from(imageText),
                        extension: '.png'
                    }
                }
            }],
            shaders: [{
                uri: shaderText
            }]
        };
        var glb = getBinaryGltf(gltf, {
            embed: false
        });
        var parsedGltf = parseBinaryGltf(glb);
        var buffer = parsedGltf.buffers[0];
        var source = buffer.extras._pipeline.source;
        var shader = parsedGltf.shaders[0];
        expect(shader.bufferView).not.toBeDefined();
        var image = parsedGltf.images[0];
        var imageBufferView = parsedGltf.bufferViews[image.bufferView];
        var testImageText = Buffer.from(source.slice(imageBufferView.byteOffset, imageBufferView.byteOffset + imageBufferView.byteLength)).toString();
        expect(testImageText).toEqual(imageText);
        expect(image.mimeType).toEqual('image/png');
        expect(shader.uri).toEqual(shaderText);
    });

    it('writes a binary glTF with separate shaders and images', function() {
        var shaderText = "testing shader";
        var imageText = "testing image";
        var gltf = {
            images: [{
                uri: imageText
            }],
            shaders: [{
                uri: shaderText
            }]
        };
        var glb = getBinaryGltf(gltf, {
            embed: false,
            embedImage: false
        });
        var parsedGltf = parseBinaryGltf(glb);
        expect(parsedGltf.buffers).not.toBeDefined();
        var shader = parsedGltf.shaders[0];
        expect(shader.bufferView).not.toBeDefined();
        expect(shader.uri).toEqual(shaderText);
        var image = parsedGltf.images[0];
        expect(image.bufferView).not.toBeDefined();
        expect(image.uri).toEqual(imageText);
    });
});
