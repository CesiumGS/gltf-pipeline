'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Low.png';
var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var transparentImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AcGERIfpcOGjwAAAQZJREFUGNMFwcErQ3EAwPHv7+3JEw2FFe+lZ9vpTTnYiR2MsyKuE8VB/ojdlZuDg4sVyUU7TVK7KG05jFgWPdt6oqWI5/E87/l8RNO8zyoylF4EtTeB6wWMhH2mNMG3B3KHDMemxOFdQEj4qN3tPDoS9Q+HxaiPdNkS5G5+SUV1xoYG6VNcRvvh9ClMS+hIZ6aLocZY0M+Zj1X59CMcXXmsJUO4dh7Z0HTiEZvN3DQDvcNk5mrYyU5q5SUK1QuktGpxkE/x8OpSaVqUSxt81bfYKewxkVhF9h1BjxJHyBW84I/dk23ebVieWWF2fB1hNZ6zSlsXxdt9rhtFgsDH0CZJJzK43g//gYBjzrZ4jf0AAAAASUVORK5CYII=';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('loadImageUris', function() {
    var imageData;
    var options = {
        basePath: basePath
    };

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

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).then(function(f) {
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

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).then(function() {
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

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).then(function() {
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

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).catch(function(err) {
            expect(err).toBeDefined();
            done();
        });
    });

    it('adds jimpScratch and loads a jimp of the image', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": imageUri
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).then(function() {
            var pipelineExtras = gltf.images.Image0001.extras._pipeline;
            expect(pipelineExtras.imageChanged).toEqual(false);
            expect(pipelineExtras.transparent).toEqual(false);
            var jimpImage = pipelineExtras.jimpImage;
            expect(jimpImage).toBeDefined();
            expect(jimpImage.bitmap.width).toEqual(8);
            expect(jimpImage.bitmap.height).toEqual(8);

            var jimpScratch = gltf.extras._pipeline.jimpScratch;
            expect(jimpScratch).toBeDefined();
            expect(jimpScratch.bitmap.width).toEqual(1);
            expect(jimpScratch.bitmap.height).toEqual(1);
            done();
        });
    });

    it('detects that the loaded image is transparent', function(done) {
        var gltf = {
            "images": {
                "Image0001": {
                    "uri": transparentImageUri
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options).then(function() {
            var pipelineExtras = gltf.images.Image0001.extras._pipeline;
            expect(pipelineExtras.transparent).toEqual(true);
            done();
        });
    });
});
