'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var loadGltfUris = require('../../lib/loadGltfUris');
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Low.png';
var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('loadImageUris', function() {
    var imageData;

    beforeAll(function(done) {
        fs.readFile(imagePath, function (err, data) {
            if (err) {
                throw err;
            }
            imageData = data;
            done();
        });
    });
    
    it('loads an external image', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": "Cesium_Logo_Flat_Low.png"
                }
            }
        };

        loadGltfUris(gltf, basePath, function(err, gltf) {
            expect(gltf.images.Image0001.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.images.Image0001.extras._pipeline.source, imageData)).toBe(true);
            expect(gltf.images.Image0001.extras._pipeline.extension).toEqual('.png');
            done();
        });
    });

    it('loads an embedded image', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": imageUri
                }
            }
        };

        loadGltfUris(gltf, basePath, function(err, gltf) {
            expect(gltf.images.Image0001.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.images.Image0001.extras._pipeline.source, imageData)).toBe(true);
            expect(gltf.images.Image0001.extras._pipeline.extension).toEqual('.png');
            done();
        });
    });

    it('loads an external and an embedded image', function(done) {
        var gltf = {
            "images": {
                "embeddedImage0001": {
                    "uri": imageUri
                },
                "externalImage0001": {
                    "uri": "Cesium_Logo_Flat_Low.png"
                }
            }
        };
        
        loadGltfUris(gltf, basePath, function(err, gltf) {
            expect(gltf.images.embeddedImage0001.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.images.embeddedImage0001.extras._pipeline.source, imageData)).toBe(true);
            expect(gltf.images.embeddedImage0001.extras._pipeline.extension).toEqual('.png');
            expect(gltf.images.externalImage0001.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.images.externalImage0001.extras._pipeline.source, imageData)).toBe(true);
            expect(gltf.images.externalImage0001.extras._pipeline.extension).toEqual('.png');
            done();
        });
    });

    it('throws an error', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": "Cesium_Logo_Error.png"
                }
            }
        };

        loadGltfUris(gltf, basePath, function(err, gltf) {
            expect(err).toBeDefined();
            done();
        });
    });

    it('does not load a jimp of the image if imageProcess is undefined', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": imageUri
                }
            },
            "extras": {
                "_pipeline": {}
            }
        };

        loadGltfUris(gltf, basePath, function(err, gltf) {
            expect(gltf.images.Image0001.extras._pipeline.jimpImage).not.toBeDefined();
            done();
        });
    });

    it('adds jimpScratch and loads a jimp of the image if imageProcess is true', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": imageUri
                }
            },
            "extras": {
                "_pipeline": {}
            }
        };

        loadGltfUris(gltf, basePath, function(err, gltf) {
            var jimpImage = gltf.images.Image0001.extras._pipeline.jimpImage;
            expect(jimpImage).toBeDefined();
            expect(jimpImage.bitmap.width).toEqual(8);
            expect(jimpImage.bitmap.height).toEqual(8);

            var jimpScratch = gltf.extras._pipeline.jimpScratch;
            expect(jimpScratch).toBeDefined();
            expect(jimpScratch.bitmap.width).toEqual(1);
            expect(jimpScratch.bitmap.height).toEqual(1);
            done();
        }, true);
    });
});
