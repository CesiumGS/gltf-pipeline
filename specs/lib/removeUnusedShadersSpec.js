'use strict';

var removeUnusedShaders = require('../../lib/removeUnusedShaders');
var OptimizationStatistics = require('../../lib/OptimizationStatistics');

describe('removeUnusedShaders', function() {
    it('removes a shader', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                },
                "CesiumTexturedBoxTest0VS": {
                    "type": 35633,
                    "uri": "CesiumTexturedBoxTest0VS.glsl"
                },
                "unusedShaderId": {
                    "type": 35633,
                    "uri": "CesiumTexturedBoxTest0VS.glsl"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedShaders(gltf, stats);
        expect(gltf.shaders.unusedShaderId).not.toBeDefined();
        expect(stats.numberRemoved.shaders).toEqual(1);
    });

    it('does not remove any shaders', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
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

        var stats = new OptimizationStatistics();
        removeUnusedShaders(gltf, stats);
        expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();
        expect(stats.numberRemoved.shaders).toEqual(0);
    });
});