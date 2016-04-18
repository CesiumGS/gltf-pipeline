'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var loadGltfUris = require('../../lib/loadGltfUris');
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var fragmentShaderUri = 'data:text/plain;base64,cHJlY2lzaW9uIGhpZ2hwIGZsb2F0Ow0KdmFyeWluZyB2ZWMzIHZfbm9ybWFsOw0KdmFyeWluZyB2ZWMyIHZfdGV4Y29vcmQwOw0KdW5pZm9ybSBzYW1wbGVyMkQgdV9kaWZmdXNlOw0KdW5pZm9ybSB2ZWM0IHVfc3BlY3VsYXI7DQp1bmlmb3JtIGZsb2F0IHVfc2hpbmluZXNzOw0Kdm9pZCBtYWluKHZvaWQpIHsNCnZlYzMgbm9ybWFsID0gbm9ybWFsaXplKHZfbm9ybWFsKTsNCnZlYzQgY29sb3IgPSB2ZWM0KDAuLCAwLiwgMC4sIDAuKTsNCnZlYzQgZGlmZnVzZSA9IHZlYzQoMC4sIDAuLCAwLiwgMS4pOw0KdmVjNCBzcGVjdWxhcjsNCmRpZmZ1c2UgPSB0ZXh0dXJlMkQodV9kaWZmdXNlLCB2X3RleGNvb3JkMCk7DQpzcGVjdWxhciA9IHVfc3BlY3VsYXI7DQpkaWZmdXNlLnh5eiAqPSBtYXgoZG90KG5vcm1hbCx2ZWMzKDAuLDAuLDEuKSksIDAuKTsNCmNvbG9yLnh5eiArPSBkaWZmdXNlLnh5ejsNCmNvbG9yID0gdmVjNChjb2xvci5yZ2IgKiBkaWZmdXNlLmEsIGRpZmZ1c2UuYSk7DQpnbF9GcmFnQ29sb3IgPSBjb2xvcjsNCn0NCg==';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('loadShaderUris', function() {
    var fragmentShaderData;

    beforeAll(function(done) {
        fs.readFile(fragmentShaderPath, function (err, data) {
            if (err) {
                throw err;
            }
            fragmentShaderData = data;
            done();
        });
    });
    
    it('loads an external shader', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                }
            }
        };
        
        gltf = loadGltfUris(gltf, basePath, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.extension).toEqual('.glsl');
            done();
        });
    });

    it('loads an embedded shader', function(done) {
        var gltf = {
            "shaders": {
                "box0FS": {
                    "type": 35632,
                    "uri": fragmentShaderUri
                }
            }
        };
        
        gltf = loadGltfUris(gltf, basePath, function() {
            expect(gltf.shaders.box0FS.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.shaders.box0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
            expect(gltf.shaders.box0FS.extras._pipeline.extension).toEqual('.glsl');
            done();
        });
    });

    it('loads an external and an embedded shader', function(done) {
        var gltf = {
            "shaders": {
                "embeddedBox0FS": {
                    "type": 35632,
                    "uri": fragmentShaderUri
                },
                "externalBox0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                }
            }
        };
        
        gltf = loadGltfUris(gltf, basePath, function() {
            expect(gltf.shaders.externalBox0FS.extras._pipeline.source).toBeDefined();
            expect(bufferEqual(gltf.shaders.embeddedBox0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
            expect(gltf.shaders.externalBox0FS.extras._pipeline.extension).toEqual('.glsl');
            done();
        });
    });

    it('throws an error', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTestError.glsl"
                },
            }
        };

        loadGltfUris(gltf, basePath, function(err) {
            expect(err).toBeDefined();
            done();
        });
    });
});