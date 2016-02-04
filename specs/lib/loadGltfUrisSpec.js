'use strict';

var fs = require('fs');
var loadGltfUris = require('../../lib/loadGltfUris');
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var vertexShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0VS.glsl';

describe('loadGltfUris', function() {
    it('loads two shaders', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                },
                "CesiumTexturedBoxTest0VS": {
                    "type": 35633,
                    "uri": "CesiumTexturedBoxTest0VS.glsl"
                }
            }
        };
        
        fs.readFile(fragmentShaderPath, function (err, fragmentShaderData) {
            if (err) {
                throw err;
            }

            fs.readFile(vertexShaderPath, function (err, vertexShaderData) {
                if (err) {
                    throw err;
                }

                gltf = loadGltfUris('./specs/data/boxTexturedUnoptimized', gltf, function(uri) {
                    if (uri === 'CesiumTexturedBoxTest0FS.glsl') {
                        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source).toBeDefined();
                        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source).toEqual(fragmentShaderData);
                    }
                    if (uri === 'CesiumTexturedBoxTest0VS.glsl') {
                        expect(gltf.shaders.CesiumTexturedBoxTest0VS.extras.source).toBeDefined();
                        expect(gltf.shaders.CesiumTexturedBoxTest0VS.extras.source).toEqual(vertexShaderData);
                    }

                    done();
                });
            });
        });
    });

    // it('throws an error', function(done) {
    //     var gltf = {
    //         "shaders": {
    //             "CesiumTexturedBoxTest0FS": {
    //                 "type": 35632,
    //                 "uri": "CesiumTexturedBoxTestError.glsl"
    //             },
    //         }
    //     };

    //     // loadGltfUris('./specs/data/boxTexturedUnoptimized', gltf);
    //     // expect(function() {
    //     //     loadGltfUris('./specs/data/boxTexturedUnoptimized', gltf, function() {
    //     //         process.stdout.write('DONE\n');
    //     //         // throw new Error();
    //     //         throw new Error("Unexpected error!");
    //     //         done();
    //     //     });
    //     // }).toThrow(new Error("Unexpected error!"));

    //     // expect(loadGltfUris.bind('./specs/data/boxTexturedUnoptimized', gltf);
    //     // ).toThrow();
    //     // done();
    //     // try {
    //     //     loadGltfUris('./specs/data/boxTexturedUnoptimized', gltf);
    //     // }
    //     // catch (err) {
    //     //     process.stdout.write('CAUGHT\n');
    //     //     done();
    //     // }

    //     loadGltfUris('./specs/data/boxTexturedUnoptimized', gltf, function() {
    //         done();
    //     });
    // });
});