'use strict';

var fs = require('fs');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var writeGltf = require('../../lib/writeGltf');
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Low.png';
var imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVBhXAcgAN/8B49/cCAQAyukB2vAB+vz/Ig7+QR0B+PwAAezj3LDfAqnZ/wMB/xwPBwUEAiMK91Uj/gLN6wGj1fs9IyEwGxoUCPotFQC75g7rASECvd/6KxwkVCHFUiTX9P4Xq9L8ZjUD+vWyAaHK+CUX+pujFBYRH1NR2vUAANrLX8zXyAJCHOWnsj3d7frR4+XLymz24Y6ZuKI7LGUE/vcBEAglAQTR/P/9nbmV8fUAYURiTjRqAeXi6AgFDMDWptPiwP///isdPEIsXvr8+Tj0Y5s8qCp8AAAAAElFTkSuQmCC';
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputImagePath = './specs/data/boxTexturedUnoptimized/output/Cesium_Logo_Flat_Low.png';

describe('writeImages', function() {
    var imageData;
    var testGltf;

    beforeAll(function(done) {
        fs.readFile(imagePath, function (err, data) {
            if (err) {
                throw err;
            }
            imageData = data;
            testGltf = {
                "images": {
                    "Cesium_Logo_Flat_Low": {
                        "uri": imageUri,
                        "extras": {
                            "_pipeline": {
                                "source": imageData,
                                "extension": '.png',
                                "deleteExtras": true
                            }
                        }
                    }
                }
            };
            done();
        });
    });

    it('writes an external buffer', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, outputPath, false, false, true, function() {
            expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
            expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual('Cesium_Logo_Flat_Low.png');
            fs.readFile(outputImagePath, function(err, outputData) {
                if (err) {
                    throw err;
                }
                expect(bufferEqual(outputData, imageData)).toBe(true);
                done();
            });
        });
    });

    it('writes an embedded buffer', function(done) {
        var gltf = clone(testGltf);
        
        writeGltf(gltf, outputPath, true, true, true, function() {
            expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
            expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual(imageUri);
            done();
        });
    });

    it('writes an embedded buffer with external images', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, outputPath, true, false, true, function() {
            expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
            expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual('Cesium_Logo_Flat_Low.png');
            done();
        });
    });
});