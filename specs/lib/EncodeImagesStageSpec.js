'use strict';
var Jimp = require('jimp');
var Promise = require('bluebird');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var dataUriToBuffer = require('data-uri-to-buffer');

var addPipelineExtras = require('../../lib/addPipelineExtras');
var EncodeImagesStage = require('../../lib/EncodeImagesStage');
var loadGltfUris = require('../../lib/loadGltfUris');

var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('encodeImages', function() {
    var imageBuffer = dataUriToBuffer(imageUri);
    var options = {
        basePath: basePath
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

        addPipelineExtras(gltf);
        loadGltfUris(gltfClone, options)
            .then(function() {
                var pipelineExtras0001 = gltfClone.images.Image0001.extras._pipeline;
                var pipelineExtras0002 = gltfClone.images.Image0002.extras._pipeline;

                var encodeImages = new EncodeImagesStage();
                encodeImages.run(gltfClone)
                    .then(function() {
                        expect(bufferEqual(pipelineExtras0001.source, imageBuffer)).toBe(true);
                        expect(bufferEqual(pipelineExtras0002.source, imageBuffer)).toBe(true);
                        done();
                    });
            });
    });

    it('re-encodes any jimp images and replaces the existing source', function(done) {
        var gltfClone = clone(gltf);

        addPipelineExtras(gltf);
        loadGltfUris(gltfClone, options)
            .then(function() {
                var pipelineExtras0001 = gltfClone.images.Image0001.extras._pipeline;
                var jimpImage001 = pipelineExtras0001.jimpImage;
                jimpImage001.resize(10, 10, Jimp.RESIZE_BEZIER);
                pipelineExtras0001.imageChanged = true;

                var pipelineExtras0002 = gltfClone.images.Image0002.extras._pipeline;
                var jimpImage002 = pipelineExtras0002.jimpImage;
                pipelineExtras0002.imageChanged = true;

                var encodeImages = new EncodeImagesStage();
                encodeImages.run(gltfClone)
                    .then(function() {
                        expect(jimpImage001.bitmap.width).toEqual(10);
                        expect(jimpImage001.bitmap.height).toEqual(10);

                        expect(jimpImage002.bitmap.width).toEqual(8);
                        expect(jimpImage002.bitmap.height).toEqual(8);

                        expect(bufferEqual(pipelineExtras0001.source, imageBuffer)).not.toBe(true);
                        expect(bufferEqual(pipelineExtras0002.source, imageBuffer)).not.toBe(true);

                        // expect the buffers to still be readable by jimp (valid image buffer)
                        var promises = [];
                        promises.push(Jimp.read(pipelineExtras0001.source)
                            .then(function(image) {
                                expect(image.bitmap.height).toEqual(10);
                                expect(jimpImage001.bitmap.height).toEqual(10);
                            }));
                        promises.push(Jimp.read(pipelineExtras0002.source)
                            .then(function(image) {
                                expect(image.bitmap.height).toEqual(8);
                                expect(jimpImage002.bitmap.height).toEqual(8);
                            }));
                        Promise.all(promises)
                            .then(function() {
                                done();
                            });
                    });

            });
    });
});
