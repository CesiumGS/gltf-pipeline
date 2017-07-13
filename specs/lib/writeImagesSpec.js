'use strict';
var clone = require('clone');
var fsExtra = require('fs-extra');

var writeGltf = require('../../lib/writeGltf');

var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Low.png';
var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputImagePath = './specs/data/boxTexturedUnoptimized/output/Cesium_Logo_Flat_Low.png';

describe('writeImages', function() {
    var imageData;
    var testGltf;

    beforeAll(function(done) {
        expect(fsExtra.readFile(imagePath)
            .then(function(data) {
                imageData = data;
                testGltf = {
                    images: [
                        {
                            uri: imageUri,
                            extras: {
                                _pipeline: {
                                    source: imageData,
                                    extension: '.png'
                                }
                            },
                            name: 'Cesium_Logo_Flat_Low'
                        }
                    ]
                };
            }), done).toResolve();
    });

    it('writes an external buffer', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        };

        expect(writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images[0].extras).not.toBeDefined();
                expect(gltf.images[0].uri).toEqual('Cesium_Logo_Flat_Low.png');
                return fsExtra.readFile(outputImagePath);
            })
            .then(function (outputData) {
                expect(outputData.equals(imageData)).toBe(true);
            }), done).toResolve();
    });

    it('writes an embedded buffer', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        expect(writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images[0].extras).not.toBeDefined();
                expect(gltf.images[0].uri).toEqual(imageUri);
            }), done).toResolve();
    });

    it('writes an embedded buffer with external images', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : false,
            createDirectory : true
        };

        expect(writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images[0].extras).not.toBeDefined();
                expect(gltf.images[0].uri).toEqual('Cesium_Logo_Flat_Low.png');
            }), done).toResolve();
    });
});
