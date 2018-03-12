'use strict';
var Cesium = require('cesium');
var addDefaults = require('../../lib/addDefaults');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var processModelMaterialsCommon = require('../../lib/processModelMaterialsCommon');

var clone = Cesium.clone;
var WebGLConstants = Cesium.WebGLConstants;

describe('processModelMaterialsCommon', function() {
    it('generates techniques and nodes for KHR_materials_common lights', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {
                            material: 0
                        }
                    ]
                }
            ],
            materials: [
                {
                    extensions : {
                        KHR_materials_common : {
                            technique : 'BLINN'
                        }
                    }
                },
                {
                    // Second unused material included for testing purposes
                    extensions : {
                        KHR_materials_common : {
                            technique : 'BLINN'
                        }
                    }
                }
            ],
            nodes: [
                {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'ambientLight'
                        }
                    }
                },
                {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'directionalLight'
                        }
                    }
                },
                {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'pointLight'
                        }
                    }
                },
                {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'spotLight'
                        }
                    }
                }
            ],
            extensionsUsed: [
                'KHR_materials_common'
            ],
            extensions: {
                KHR_materials_common : {
                    lights: [
                        {
                            ambient: {
                                color: [1.0, 1.0, 1.0]
                            },
                            type: 'ambient'
                        },
                        {
                            directional: {
                                color: [1.0, 1.0, 1.0]
                            },
                            type: 'directional'
                        },
                        {
                            point: {
                                color: [1.0, 1.0, 1.0]
                            },
                            constantAttenuation: 0.0,
                            distance: 0.0,
                            linearAttenuation: 1.0,
                            quadraticAttenuation: 1.0,
                            type: 'point'
                        },
                        {
                            spot: {
                                spot: [1.0, 1.0, 1.0]
                            },
                            constantAttenuation: 0.0,
                            distance: 0.0,
                            linearAttenuation: 1.0,
                            quadraticAttenuation:1.0,
                            falloffAngle: 1.5,
                            falloffExponent: 0.0,
                            type: 'spot'
                        }
                    ]
                }
            }
        };
        var expectValues = {
            ambient: [0.0, 0.0, 0.0, 1.0],
            diffuse: [0.0, 0.0, 0.0, 1.0],
            emission: [0.0, 0.0, 0.0, 1.0],
            specular: [0.0, 0.0, 0.0, 1.0],
            shininess: 0.0,
            transparency: 1.0,
            transparent: false,
            doubleSided: false
        };
        addDefaults(gltf);
        addPipelineExtras(gltf);
        processModelMaterialsCommon(gltf);
        expect(gltf.materials.length).toBeGreaterThan(0);
        expect(gltf.techniques.length).toBeGreaterThan(0);
        var materialsLength = gltf.materials.length;
        for (var materialId = 0; materialId < materialsLength; materialId++) {
          expect(gltf.materials[materialId].values).toEqual(expectValues);
        }
    });

    it('works with optimizeForCesium', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {
                            material: 0
                        }
                    ]
                }
            ],
            extensionsUsed: ['KHR_materials_common'],
            materials: [
                {
                    extensions: {
                        KHR_materials_common: {
                            technique: 'BLINN',
                            values: {
                                ambient: [0.0, 0.0, 0.0, 1.0],
                                diffuse: [1.0, 0.0, 0.0, 1.0],
                                emission: [1.0, 1.0, 1.0, 1.0]
                            }
                        }
                    }
                }
            ]
        };

        var gltfClone = clone(gltf, true);
        var options = {
            optimizeForCesium : true
        };
        addDefaults(gltfClone, options);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone, options);

        // Uses the Cesium sun as its default light source
        var fragmentShaderSource = gltfClone.shaders[gltfClone.programs[0].fragmentShader].extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(true);

        // Adds the _3DTILESDIFFUSE flag
        var technique = gltfClone.techniques[0];
        expect(technique.parameters.diffuse.semantic).toEqual('_3DTILESDIFFUSE');

        gltfClone = clone(gltf, true);
        addDefaults(gltfClone);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone);

        fragmentShaderSource = gltfClone.shaders[gltfClone.programs[0].fragmentShader].extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(false);
    });

    it('adds nonstandard semantic', function() {
        var gltf = {
            accessors: [
                {
                    componentType: 5123,
                    type: 'SCALAR'
                }
            ],
            extensionsUsed: [
                'KHR_materials_common'
            ],
            meshes: [
                {
                    primitives: [
                        {
                            attributes: {
                                NORMAL: 1,
                                POSITION: 2,
                                _BATCHID: 0
                            },
                            indices: 3,
                            material: 0,
                            mode: 4
                        }
                    ]
                }
            ],
            materials: [
                {
                    extensions: {
                        KHR_materials_common: {
                            doubleSided: false,
                            jointCount: 0,
                            technique: 'PHONG',
                            transparent: false,
                            values: {
                                'diffuse': [
                                    0.4,
                                    0.4,
                                    0.4,
                                    1
                                ]
                            }
                        }
                    },
                    name: 'material1'
                }
            ]
        };

        var gltfClone = clone(gltf);
        addDefaults(gltfClone);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone);

        var material = gltfClone.materials[0];
        var technique = gltfClone.techniques[material.technique];
        expect(technique.attributes.a_batchid).toEqual('batchid');
        expect(technique.parameters.batchid.semantic).toEqual('_BATCHID');

        var program = gltfClone.programs[technique.program];
        expect(program.attributes.indexOf('a_batchid') > -1).toBe(true);

        var vertexShaderSource = gltfClone.shaders[program.vertexShader].extras._pipeline.source;
        expect(vertexShaderSource.indexOf('a_batchid') > -1).toBe(true);
    });

    it('splits two materials with different types for JOINT and WEIGHT', function() {
        var gltf = {
            accessors: [
                {
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC4'
                }, {
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC4'
                }, {
                    componentType: WebGLConstants.FLOAT,
                    type: 'MAT3'
                }, {
                    componentType: WebGLConstants.FLOAT,
                    type: 'MAT3'
                }
            ],
            extensionsUsed: [
                'KHR_materials_common'
            ],
            materials: [
                {
                    extensions: {
                        KHR_materials_common: {
                            jointCount: 14,
                            technique: 'BLINN'
                        }
                    }
                }
            ],
            meshes: [
                {
                    primitives: [{
                        attributes: {
                            JOINT: 0,
                            WEIGHT: 1
                        },
                        material: 0
                    }]
                }, {
                    primitives: [{
                        attributes: {
                            JOINT: 2,
                            WEIGHT: 3
                        },
                        material: 0
                    }]
                }
            ]
        };
        addDefaults(gltf);
        addPipelineExtras(gltf);
        processModelMaterialsCommon(gltf);

        var meshes = gltf.meshes;
        var primitiveVec4 = meshes[0].primitives[0];
        var primitiveMat3 = meshes[1].primitives[0];
        var materialVec4Id = primitiveVec4.material;
        var materialMat3Id = primitiveMat3.material;
        expect(materialVec4Id).not.toEqual(materialMat3Id);

        var materials = gltf.materials;
        var techniques = gltf.techniques;
        var techniqueVec4 = techniques[materials[materialVec4Id].technique];
        var techniqueMat3 = techniques[materials[materialMat3Id].technique];
        expect(techniqueVec4.parameters.joint.type).toEqual(WebGLConstants.FLOAT_VEC4);
        expect(techniqueMat3.parameters.joint.type).toEqual(WebGLConstants.FLOAT_MAT3);
    });

    it('material referenced by a primitive with vertex colors and a primitive without vertex colors is split', function() {
        var gltf = {
            accessors: [
                {
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC4'
                }
            ],
            extensionsUsed: [
                'KHR_materials_common'
            ],
            materials: [
                {
                    extensions: {
                        KHR_materials_common: {
                            technique: 'BLINN'
                        }
                    }
                }
            ],
            meshes: [
                {
                    primitives: [{
                        attributes: {
                            COLOR_0: 0
                        },
                        material: 0
                    }]
                }, {
                    primitives: [{
                        material: 0
                    }]
                }
            ]
        };
        addDefaults(gltf);
        addPipelineExtras(gltf);
        processModelMaterialsCommon(gltf);

        var meshes = gltf.meshes;
        var materialWithVertexColors = meshes[0].primitives[0].material;
        var materialWithoutVertexColors = meshes[1].primitives[0].material;
        expect(materialWithVertexColors).not.toEqual(materialWithoutVertexColors);
    });
});
