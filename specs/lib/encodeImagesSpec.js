'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var encodeImages = require('../../lib/encodeImages');
var loadGltfUris = require('../../lib/loadGltfUris');
var dataUriToBuffer = require('data-uri-to-buffer');
var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var basePath = './specs/data/boxTexturedUnoptimized/';
var clone = require('clone');
var Jimp = require('jimp');

describe('encodeImages', function() {
    var imageData;
    var imageBuffer = dataUriToBuffer(imageUri);
    var options = {
        basePath: basePath,
        imageProcess: true
    };

    var gltf = {
        "images": {
            "Image0001": {
                "uri": imageUri
            },
            "Image0002": {
                "uri": imageUri
            }
        },
        "extras": {
            "_pipeline": {}
        }
    };

    it('does not re-encode if the images have not been changed', function(done) {
        var gltfClone = clone(gltf);

        loadGltfUris(gltfClone, options, function() {
            var pipelineExtras0001 = gltfClone.images.Image0001.extras._pipeline;
            var pipelineExtras0002 = gltfClone.images.Image0002.extras._pipeline;

            encodeImages(gltfClone, function() {
                expect(bufferEqual(pipelineExtras0001.source, imageBuffer)).toBe(true);
                expect(bufferEqual(pipelineExtras0002.source, imageBuffer)).toBe(true);
                done();
            });
        }, true);
    });

    it('re-encodes any jimp images and replaces the existing source', function(done) {
        var gltfClone = clone(gltf);

        loadGltfUris(gltfClone, options, function() {
            var pipelineExtras0001 = gltfClone.images.Image0001.extras._pipeline;
            var jimpImage001 = pipelineExtras0001.jimpImage;
            jimpImage001.resize(10, 10, Jimp.RESIZE_BEZIER);
            pipelineExtras0001.imageChanged = true;

            var pipelineExtras0002 = gltfClone.images.Image0002.extras._pipeline;
            var jimpImage002 = pipelineExtras0002.jimpImage;
            pipelineExtras0002.imageChanged = true;

            encodeImages(gltfClone, function() {
                expect(jimpImage001.bitmap.width).toEqual(10);
                expect(jimpImage001.bitmap.height).toEqual(10);

                expect(jimpImage002.bitmap.width).toEqual(8);
                expect(jimpImage002.bitmap.height).toEqual(8);

                expect(bufferEqual(pipelineExtras0001.source, imageBuffer)).not.toBe(true);
                expect(bufferEqual(pipelineExtras0002.source, imageBuffer)).not.toBe(true);

                // expect the buffers to still be readable by jimp (valid image buffer)
                Jimp.read(pipelineExtras0001.source, function(jimpErr, image) {
                    expect(image.bitmap.height).toEqual(10);
                    expect(jimpImage001.bitmap.height).toEqual(10);
                    Jimp.read(pipelineExtras0002.source, function(jimpErr, image) {
                        expect(image.bitmap.height).toEqual(8);
                        expect(jimpImage002.bitmap.height).toEqual(8);
                        done();
                    });
                });
            });
        }, true);
    });
});
