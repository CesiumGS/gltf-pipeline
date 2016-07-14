'use strict';
var bufferEqual = require('buffer-equal');
var clone = require('clone');
var fs = require('fs');
var Promise = require('bluebird');

var writeGltf = require('../../lib/writeGltf');

var fsReadFile = Promise.promisify(fs.readFile);

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
        var options = {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        };

        writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
                expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual('Cesium_Logo_Flat_Low.png');
                return fsReadFile(outputImagePath);
            })
            .then(function (outputData) {
                expect(bufferEqual(outputData, imageData)).toBe(true);
                done();
            });
    });

    it('writes an embedded buffer', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };
        
        writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
                expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual(imageUri);
                done();
            });
    });

    it('writes an embedded buffer with external images', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : false,
            createDirectory : true
        };
        
        writeGltf(gltf, options)
            .then(function() {
                expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
                expect(gltf.images.Cesium_Logo_Flat_Low.uri).toEqual('Cesium_Logo_Flat_Low.png');
                done();
            });
    });
});
