'use strict';
var Cesium = require('cesium');
var updateMaterialProperties = require('../../lib/updateMaterialProperties');

var WebGLConstants = Cesium.WebGLConstants;

describe('updateMaterialProperties', function() {
    it('sets material.doubleSided property if CULL_FACE is not enabled', function () {
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
                        ]
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

        var gltfWithUpdatedMaterials = updateMaterialProperties(gltf);
        var material = gltfWithUpdatedMaterials.materials[0];
        expect(material.doubleSided).toBe(true);

        gltf = {
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
                            WebGLConstants.BLEND,
                            WebGLConstants.CULL_FACE
                        ]
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

        gltfWithUpdatedMaterials = updateMaterialProperties(gltf);
        material = gltfWithUpdatedMaterials.materials[0];
        expect(material.doubleSided).toBeUndefined();
    });

    it('sets alphaMode and moves technique render state blending functions to material EXT_blend extension', function() {
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
                            WebGLConstants.BLEND,
                            WebGLConstants.CULL_FACE
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

        var gltfWithBlendExtension = updateMaterialProperties(gltf);
        expect(gltfWithBlendExtension.extensionsUsed.indexOf('EXT_blend')).toBeGreaterThan(-1);
        expect(gltfWithBlendExtension.extensionsRequired.indexOf('EXT_blend')).toEqual(-1);

        var material = gltfWithBlendExtension.materials[0];
        expect(material.alphaMode).toBe('BLEND');
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

    it('does not set alphaMode or add EXT_blend if no blending is found in render states', function () {
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
                            WebGLConstants.CULL_FACE
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

        var gltfWithBlendExtension = updateMaterialProperties(gltf);
        expect(gltfWithBlendExtension.extensionsUsed.indexOf('EXT_blend')).toEqual(-1);
        expect(gltfWithBlendExtension.extensionsRequired.indexOf('EXT_blend')).toEqual(-1);

        var material = gltfWithBlendExtension.materials[0];
        expect(material.alphaMode).toBeUndefined();
        expect(material.extensions).toBeDefined();
        var materialBlending = material.extensions.EXT_blend;
        expect(materialBlending).toBeUndefined();
    });
});
