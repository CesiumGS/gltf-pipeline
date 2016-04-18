'use strict';

var fs = require('fs');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var writeGltf = require('../../lib/writeGltf');
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var fragmentShaderUri = "data:text/plain;base64,cHJlY2lzaW9uIGhpZ2hwIGZsb2F0Ow0KdmFyeWluZyB2ZWMzIHZfbm9ybWFsOw0KdmFyeWluZyB2ZWMyIHZfdGV4Y29vcmQwOw0KdW5pZm9ybSBzYW1wbGVyMkQgdV9kaWZmdXNlOw0KdW5pZm9ybSB2ZWM0IHVfc3BlY3VsYXI7DQp1bmlmb3JtIGZsb2F0IHVfc2hpbmluZXNzOw0Kdm9pZCBtYWluKHZvaWQpIHsNCnZlYzMgbm9ybWFsID0gbm9ybWFsaXplKHZfbm9ybWFsKTsNCnZlYzQgY29sb3IgPSB2ZWM0KDAuLCAwLiwgMC4sIDAuKTsNCnZlYzQgZGlmZnVzZSA9IHZlYzQoMC4sIDAuLCAwLiwgMS4pOw0KdmVjNCBzcGVjdWxhcjsNCmRpZmZ1c2UgPSB0ZXh0dXJlMkQodV9kaWZmdXNlLCB2X3RleGNvb3JkMCk7DQpzcGVjdWxhciA9IHVfc3BlY3VsYXI7DQpkaWZmdXNlLnh5eiAqPSBtYXgoZG90KG5vcm1hbCx2ZWMzKDAuLDAuLDEuKSksIDAuKTsNCmNvbG9yLnh5eiArPSBkaWZmdXNlLnh5ejsNCmNvbG9yID0gdmVjNChjb2xvci5yZ2IgKiBkaWZmdXNlLmEsIGRpZmZ1c2UuYSk7DQpnbF9GcmFnQ29sb3IgPSBjb2xvcjsNCn0NCg==";
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputFragmentShaderPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest0FS.glsl';

describe('writeShaders', function() {
    var fragmentShaderData;
    var testGltf;

    beforeAll(function(done) {
        fs.readFile(fragmentShaderPath, function (err, data) {
            if (err) {
                throw err;
            }
            fragmentShaderData = data;
            testGltf = {
                "shaders": {
                    "CesiumTexturedBoxTest0FS": {
                        "type": 35632,
                        "uri": fragmentShaderUri,
                        "extras": {
                            "_pipeline": {
                                "source": fragmentShaderData,
                                "extension": '.glsl',
                                "deleteExtras": true
                            }
                        }
                    }
                }
            };
            done();
        });
    });

    it('writes an external shader', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, outputPath, false, true, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual('CesiumTexturedBoxTest0FS.glsl');
            fs.readFile(outputFragmentShaderPath, function(err, outputData) {
                if (err) {
                    throw err;
                }
                expect(bufferEqual(outputData, fragmentShaderData)).toBe(true);
                done();
            });
        });
    });

    it('writes an embedded shader', function(done) {
        var gltf = clone(testGltf);
        
        writeGltf(gltf, outputPath, true, true, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual(fragmentShaderUri);
            done();
        });
    });

    it('throws an error', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, './specs/errorFilePath/output.gltf', false, false, function(err) {
            expect(err).toBeDefined();
            done();
        });
    });
});