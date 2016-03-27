'use strict';

var fs = require('fs');
var bufferEqual = require('buffer-equal');
var writeGltf = require('../../lib/writeGltf');
var bufferPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.bin';
var bufferUri = 'data:application/octet-stream;base64,AAABAAIAAwACAAEABAAFAAYABwAGAAUACAAJAAoACwAKAAkADAANAA4ADwAOAA0AEAARABIAEwASABEAFAAVABYAFwAWABUAAAAAvwAAAL8AAAA/AAAAPwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAL8AAAA/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAA/AAAAPwAAAL8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAPwAAAD8AAAC/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AADAQAAAAAAAAKBAAAAAAAAAwED+/38/AACgQP7/fz8AAIBAAAAAAAAAoEAAAAAAAACAQAAAgD8AAKBAAACAPwAAAEAAAAAAAACAPwAAAAAAAABAAACAPwAAgD8AAIA/AABAQAAAAAAAAIBAAAAAAAAAQEAAAIA/AACAQAAAgD8AAEBAAAAAAAAAAEAAAAAAAABAQAAAgD8AAABAAACAPwAAAAAAAAAAAAAAAP7/fz8AAIA/AAAAAAAAgD/+/38/'
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputBufferPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest.bin';

describe('writeBuffers', function() {
    var bufferData;
    
    beforeAll(function(done) {
        fs.readFile(bufferPath, function (err, data) {
            if (err) {
                throw err;
            }
            bufferData = data;
            done();
        });
    });

    it('writes an external buffer', function(done) {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin",
                    "extras": {
                        "_pipeline": {
                            "source": bufferData,
                            "extension": '.bin',
                            "deleteExtras": true
                        }
                    }
                }
            }
        };

        writeGltf(gltf, outputPath, false, true, function() {
            expect(gltf.buffers.CesiumTexturedBoxTest.extras).not.toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest.uri).toEqual('CesiumTexturedBoxTest.bin');
            fs.readFile(outputBufferPath, function(err, outputData) {
                if (err) {
                    throw err;
                }
                expect(bufferEqual(outputData, bufferData)).toBe(true);
                done();
            });
        });
    });

    it('writes an embedded buffer', function(done) {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin",
                    "extras": {
                        "_pipeline": {
                            "source": bufferData,
                            "extension": '.bin',
                            "deleteExtras": true
                        }
                    }
                }
            }
        };
        
        writeGltf(gltf, outputPath, true, true, function() {
            expect(gltf.buffers.CesiumTexturedBoxTest.extras).not.toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest.uri).toEqual(bufferUri);
            done();
        });
    });

    it('throws an error', function(done) {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin",
                    "extras": {
                        "_pipeline": {
                            "source": bufferData,
                            "extension": '.bin',
                            "deleteExtras": true
                        }
                    }
                }
            }
        };

        writeGltf(gltf, './specs/errorFilePath/output.gltf', false, false, function(err) {
            expect(err).toBeDefined();
            done();
        });
    });
});