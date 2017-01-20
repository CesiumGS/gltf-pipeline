'use strict';
var bufferEqual = require('buffer-equal');
var clone = require('clone');
var fs = require('fs');
var Promise = require('bluebird');

var writeGltf = require('../../lib/writeGltf');

var fsReadFile = Promise.promisify(fs.readFile);

var bufferPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.bin';
var bufferUri = 'data:application/octet-stream;base64,AAABAAIAAwACAAEABAAFAAYABwAGAAUACAAJAAoACwAKAAkADAANAA4ADwAOAA0AEAARABIAEwASABEAFAAVABYAFwAWABUAAAAAvwAAAL8AAAA/AAAAPwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAL8AAAA/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAA/AAAAPwAAAL8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAPwAAAD8AAAC/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AADAQAAAAAAAAKBAAAAAAAAAwED+/38/AACgQP7/fz8AAIBAAAAAAAAAoEAAAAAAAACAQAAAgD8AAKBAAACAPwAAAEAAAAAAAACAPwAAAAAAAABAAACAPwAAgD8AAIA/AABAQAAAAAAAAIBAAAAAAAAAQEAAAIA/AACAQAAAgD8AAEBAAAAAAAAAAEAAAAAAAABAQAAAgD8AAABAAACAPwAAAAAAAAAAAAAAAP7/fz8AAIA/AAAAAAAAgD/+/38/';
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputBufferPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest.bin';

describe('writeBuffers', function() {
    var bufferData;
    var testGltf;

    beforeAll(function(done) {
        expect(fsReadFile(bufferPath)
            .then(function(data) {
                bufferData = data;
                testGltf = {
                    "buffers": {
                        "CesiumTexturedBoxTest": {
                            "uri": "CesiumTexturedBoxTest.bin",
                            "extras": {
                                "_pipeline": {
                                    "source": bufferData,
                                    "extension": '.bin'
                                }
                            }
                        }
                    }
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
                expect(gltf.buffers.CesiumTexturedBoxTest.extras).not.toBeDefined();
                expect(gltf.buffers.CesiumTexturedBoxTest.uri).toEqual('CesiumTexturedBoxTest.bin');
                return fsReadFile(outputBufferPath);
            })
            .then(function(outputData) {
                expect(bufferEqual(outputData, bufferData)).toBe(true);
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
                expect(gltf.buffers.CesiumTexturedBoxTest.extras).not.toBeDefined();
                expect(gltf.buffers.CesiumTexturedBoxTest.uri).toEqual(bufferUri);
            }), done).toResolve();
    });
});