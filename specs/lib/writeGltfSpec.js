'use strict';

var fs = require('fs');
var writeGltf = require('../../lib/writeGltf');
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var outputPath = './specs/data/boxTexturedUnoptimized/output/output.gltf';
var outputFragmentShaderPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest0FS.glsl';
var fragmentShaderDataUri = "data:text/plain;base64,cHJlY2lzaW9uIGhpZ2hwIGZsb2F0Owp2YXJ5aW5nIHZlYzMgdl9ub3JtYWw7CnZhcnlpbmcgdmVjMiB2X3RleGNvb3JkMDsKdW5pZm9ybSBzYW1wbGVyMkQgdV9kaWZmdXNlOwp1bmlmb3JtIHZlYzQgdV9zcGVjdWxhcjsKdW5pZm9ybSBmbG9hdCB1X3NoaW5pbmVzczsKdm9pZCBtYWluKHZvaWQpIHsKdmVjMyBub3JtYWwgPSBub3JtYWxpemUodl9ub3JtYWwpOwp2ZWM0IGNvbG9yID0gdmVjNCgwLiwgMC4sIDAuLCAwLik7CnZlYzQgZGlmZnVzZSA9IHZlYzQoMC4sIDAuLCAwLiwgMS4pOwp2ZWM0IHNwZWN1bGFyOwpkaWZmdXNlID0gdGV4dHVyZTJEKHVfZGlmZnVzZSwgdl90ZXhjb29yZDApOwpzcGVjdWxhciA9IHVfc3BlY3VsYXI7CmRpZmZ1c2UueHl6ICo9IG1heChkb3Qobm9ybWFsLHZlYzMoMC4sMC4sMS4pKSwgMC4pOwpjb2xvci54eXogKz0gZGlmZnVzZS54eXo7CmNvbG9yID0gdmVjNChjb2xvci5yZ2IgKiBkaWZmdXNlLmEsIGRpZmZ1c2UuYSk7CmdsX0ZyYWdDb2xvciA9IGNvbG9yOwp9Cg==";

describe('writeGltf', function() {
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

    it('writes an external shader', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": fragmentShaderDataUri,
                    "extras": {
                        "source": fragmentShaderData
                    }
                }
            }
        };

        writeGltf(gltf, outputPath, false, false, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual('CesiumTexturedBoxTest0FS.glsl');
            fs.readFile(outputFragmentShaderPath, function(err, outputData) {
                if (err) {
                    throw err;
                }
                expect(outputData.toString()).toEqual(fragmentShaderData.toString());
                done();
            });
        });
    });

    it('writes an embedded shader', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl",
                    "extras": {
                        "source": fragmentShaderData
                    }
                }
            }
        };
        
        writeGltf(gltf, outputPath, true, false);
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source).not.toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual(fragmentShaderDataUri);
        done();
    });

    it('throws an error', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl",
                    "extras": {
                        "source": fragmentShaderData
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