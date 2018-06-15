'use strict';
var moveTechniquesToExtension = require('../../lib/moveTechniquesToExtension');

describe('moveTechniquesToExtension', function() {
    it('moves techniques, shaders, and programs to extension', function() {
        var gltf = {
            programs: {
                "program_0": {
                    attributes: [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    fragmentShader: "BoxTextured0FS",
                    vertexShader: "BoxTextured0VS"
                }
            },
            shaders: {
                "BoxTextured0FS": {
                    type: 35632,
                    uri: "BoxTextured0FS.glsl"
                },
                "BoxTextured0VS": {
                    type: 35633,
                    uri: "BoxTextured0VS.glsl"
                }
            },
            techniques: {
                "technique0" : {
                    attributes: {
                        "a_normal": "normal",
                        "a_position": "position",
                        "a_texcoord0": "texcoord0"
                    },
                    parameters: {
                        "diffuse": {
                            type: 35678
                        },
                        "modelViewMatrix": {
                            semantic: "MODELVIEW",
                            type: 35676
                        },
                        "normal": {
                            semantic: "NORMAL",
                            type: 35665
                        },
                        "normalMatrix": {
                            semantic: "MODELVIEWINVERSETRANSPOSE",
                            type: 35675
                        },
                        "position": {
                            semantic: "POSITION",
                            type: 35665
                        },
                        "projectionMatrix": {
                            semantic: "PROJECTION",
                            type: 35676
                        },
                        "shininess": {
                            type: 5126
                        },
                        "specular": {
                            type: 35666
                        },
                        "texcoord0": {
                            semantic: "TEXCOORD_0",
                            type: 35664
                        }
                    },
                    program: "program_0",
                    states: {
                        enable: [
                            2929,
                            2884
                        ]
                    },
                    uniforms: {
                        "u_diffuse": "diffuse",
                        "u_modelViewMatrix": "modelViewMatrix",
                        "u_normalMatrix": "normalMatrix",
                        "u_projectionMatrix": "projectionMatrix",
                        "u_shininess": "shininess",
                        "u_specular": "specular"
                    }
                }
            },
            materials: [
                {
                    name: "Texture",
                    technique: "technique0",
                    values: {
                        "diffuse": "texture_Image0001",
                        "shininess": 256,
                        "specular": [
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
        var techniques = gltfWithTechniquesWebgl.extensions['KHR_techniques_webgl'];
        expect(techniques).toBeDefined();
        expect(techniques.techniques.length).toBe(1);

        var technique = techniques.techniques[0];
        var attributes = technique.attributes;
        expect(attributes).toBeDefined();
        expect(attributes['a_position'].semantic).toBe('POSITION');

        var uniforms = technique.uniforms;
        expect(uniforms).toBeDefined();
        expect(uniforms['u_modelViewMatrix'].semantic).toBe('MODELVIEW');
        expect(uniforms['u_modelViewMatrix'].type).toBe(35676);

        expect(technique.program).toBe(0);
        expect(technique.parameters).toBeUndefined();
        expect(technique.states).toBeUndefined();

        expect(techniques.programs.length).toBe(1);
        var program = techniques.programs[technique.program];
        expect(program).toBeDefined();

        expect(techniques.shaders.length).toBe(2);
        expect(techniques.shaders[program.fragmentShader].type).toBe(35632);
        expect(techniques.shaders[program.vertexShader].type).toBe(35633);

        expect(gltfWithTechniquesWebgl.techniques).toBeUndefined();
        expect(gltfWithTechniquesWebgl.programs).toBeUndefined();
        expect(gltfWithTechniquesWebgl.shaders).toBeUndefined();

        var material = gltf.materials[0];
        expect(material.extensions).toBeDefined();
        var materialTechniques = material.extensions['KHR_techniques_webgl'];
        expect(materialTechniques).toBeDefined();
        expect(materialTechniques.technique).toBe(0);
        expect(materialTechniques.values['u_shininess']).toBe(256);

        expect(material.technique).toBeUndefined();
        expect(material.values).toBeUndefined();
    });
});
