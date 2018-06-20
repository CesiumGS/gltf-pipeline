'use strict';
var Cesium = require('cesium');
var moveBlendingToExtension = require('../../lib/moveBlendingToExtension');

var WebGLConstants = Cesium.WebGLConstants;

describe('moveBlendingToExtension', function() {
    it('moves technique render state to material EXT_blend extension', function() {
        var gltf = {
            programs: {
                program_0: {
                    attributes: [
                        'a_normal',
                        'a_position',
                        'a_texcoord0'
                    ],
                    fragmentShader: 'BoxTextured0FS',
                    vertexShader: 'BoxTextured0VS'
                }
            },
            shaders: {
                BoxTextured0FS: {
                    type: WebGLConstants.FRAGMENT_SHADER,
                    uri: 'BoxTextured0FS.glsl'
                },
                BoxTextured0VS: {
                    type: WebGLConstants.VERTEX_SHADER,
                    uri: 'BoxTextured0VS.glsl'
                }
            },
            techniques: {
                technique0: {
                    states: {
                        enable: [
                            WebGLConstants.DEPTH_TEST,
                            WebGLConstants.BLEND
                        ],
                        functions: {
                            blendEquationSeparate: [
                                WebGLConstants.FUNC_ADD,
                                WebGLConstants.FUNC_ADD
                            ],
                            blendFuncSeparate: [
                                WebGLConstants.ONE,
                                WebGLConstants.ONE_MINUS_SRC_ALPHA,
                                WebGLConstants.ONE,
                                WebGLConstants.ONE_MINUS_SRC_ALPHA
                            ],
                            depthMask: false
                        }
                    }
                }
            },
            materials: [
                {
                    technique: 'technique0'
                }
            ],
            extensionsUsed: [],
            extensionsRequired: []
        };

        var gltfWithBlendExtension = moveBlendingToExtension(gltf);
        expect(gltfWithBlendExtension.extensionsUsed.indexOf('EXT_blend')).toBeGreaterThan(-1);
        expect(gltfWithBlendExtension.extensionsRequired.indexOf('EXT_blend')).toEqual(-1);

        var material = gltfWithBlendExtension.materials[0];
        expect(material.extensions).toBeDefined();
        var materialBlending = material.extensions.EXT_blend;
        expect(materialBlending).toBeDefined();
        expect(materialBlending.blendEquation).toEqual([
            WebGLConstants.FUNC_ADD,
            WebGLConstants.FUNC_ADD
        ]);
        expect(materialBlending.blendFactors).toEqual([
            WebGLConstants.ONE,
            WebGLConstants.ONE_MINUS_SRC_ALPHA,
            WebGLConstants.ONE,
            WebGLConstants.ONE_MINUS_SRC_ALPHA
        ]);
    });

    it('does not add EXT_blend if no blending is found in render states', function () {
        var gltf = {
            programs: {
                program_0: {
                    attributes: [
                        'a_normal',
                        'a_position',
                        'a_texcoord0'
                    ],
                    fragmentShader: 'BoxTextured0FS',
                    vertexShader: 'BoxTextured0VS'
                }
            },
            shaders: {
                BoxTextured0FS: {
                    type: WebGLConstants.FRAGMENT_SHADER,
                    uri: 'BoxTextured0FS.glsl'
                },
                BoxTextured0VS: {
                    type: WebGLConstants.VERTEX_SHADER,
                    uri: 'BoxTextured0VS.glsl'
                }
            },
            techniques: {
                technique0: {
                    states: {
                        enable: [
                            WebGLConstants.DEPTH_TEST
                        ],
                        functions: {
                            depthMask: false
                        }
                    }
                }
            },
            materials: [
                {
                    technique: 'technique0',
                    extensions : {
                        KHR_techniques_webgl: {}
                    }
                }
            ],
            extensionsUsed: [],
            extensionsRequired: []
        };

        var gltfWithBlendExtension = moveBlendingToExtension(gltf);
        expect(gltfWithBlendExtension.extensionsUsed.indexOf('EXT_blend')).toEqual(-1);
        expect(gltfWithBlendExtension.extensionsRequired.indexOf('EXT_blend')).toEqual(-1);

        var material = gltfWithBlendExtension.materials[0];
        expect(material.extensions).toBeDefined();
        var materialBlending = material.extensions.EXT_blend;
        expect(materialBlending).toBeUndefined();
    });
});
