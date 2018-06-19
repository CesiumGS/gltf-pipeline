'use strict';
var Cesium = require('cesium');
var moveTechniquesToExtension = require('../../lib/moveTechniquesToExtension');

var WebGLConstants = Cesium.WebGLConstants;
describe('moveTechniquesToExtension', function() {
    it('moves techniques, shaders, and programs to extension', function() {
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
                technique0 : {
                    attributes: {
                        a_normal: 'normal',
                        a_position: 'position',
                        a_texcoord0: 'texcoord0'
                    },
                    parameters: {
                        diffuse: {
                            type: WebGLConstants.SAMPLER_2D
                        },
                        modelViewMatrix: {
                            semantic: 'MODELVIEW',
                            type: WebGLConstants.FLOAT_MAT4
                        },
                        normal: {
                            semantic: 'NORMAL',
                            type: WebGLConstants.FLOAT_VEC3
                        },
                        normalMatrix: {
                            semantic: 'MODELVIEWINVERSETRANSPOSE',
                            type: WebGLConstants.FLOAT_MAT3
                        },
                        position: {
                            semantic: 'POSITION',
                            type: WebGLConstants.FLOAT_VEC3
                        },
                        projectionMatrix: {
                            semantic: 'PROJECTION',
                            type: WebGLConstants.FLOAT_MAT4
                        },
                        shininess: {
                            type: WebGLConstants.FLOAT
                        },
                        specular: {
                            type: WebGLConstants.FLOAT_VEC4
                        },
                        texcoord0: {
                            semantic: 'TEXCOORD_0',
                            type: WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program: 'program_0',
                    states: {
                        enable: [
                            WebGLConstants.DEPTH_TEST,
                            WebGLConstants.CULL_FACE
                        ]
                    },
                    uniforms: {
                        u_diffuse: 'diffuse',
                        u_modelViewMatrix: 'modelViewMatrix',
                        u_normalMatrix: 'normalMatrix',
                        u_projectionMatrix: 'projectionMatrix',
                        u_shininess: 'shininess',
                        u_specular: 'specular'
                    }
                }
            },
            materials: [
                {
                    name: 'Texture',
                    technique: 'technique0',
                    values: {
                        diffuse: 'texture_Image0001',
                        shininess: 256,
                        specular: [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
                }
            ]
        };

        var gltfWithTechniquesWebgl = moveTechniquesToExtension(gltf);
        expect(gltfWithTechniquesWebgl.extensions).toBeDefined();
        var techniques = gltfWithTechniquesWebgl.extensions.KHR_techniques_webgl;
        expect(techniques).toBeDefined();
        expect(techniques.techniques.length).toBe(1);

        var technique = techniques.techniques[0];
        var attributes = technique.attributes;
        expect(attributes).toBeDefined();
        expect(attributes.a_position.semantic).toBe('POSITION');

        var uniforms = technique.uniforms;
        expect(uniforms).toBeDefined();
        expect(uniforms.u_modelViewMatrix.semantic).toBe('MODELVIEW');
        expect(uniforms.u_modelViewMatrix.type).toBe(WebGLConstants.FLOAT_MAT4);

        expect(technique.program).toBe(0);
        expect(technique.parameters).toBeUndefined();
        expect(technique.states).toBeUndefined();

        expect(techniques.programs.length).toBe(1);
        var program = techniques.programs[technique.program];
        expect(program).toBeDefined();

        expect(techniques.shaders.length).toBe(2);
        expect(techniques.shaders[program.fragmentShader].type).toBe(WebGLConstants.FRAGMENT_SHADER);
        expect(techniques.shaders[program.vertexShader].type).toBe(WebGLConstants.VERTEX_SHADER);

        expect(gltfWithTechniquesWebgl.techniques).toBeUndefined();
        expect(gltfWithTechniquesWebgl.programs).toBeUndefined();
        expect(gltfWithTechniquesWebgl.shaders).toBeUndefined();

        var material = gltf.materials[0];
        expect(material.extensions).toBeDefined();
        var materialTechniques = material.extensions.KHR_techniques_webgl;
        expect(materialTechniques).toBeDefined();
        expect(materialTechniques.technique).toBe(0);
        expect(materialTechniques.values.u_shininess).toBe(256);

        expect(material.technique).toBeUndefined();
        expect(material.values).toBeUndefined();
    });
});
