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
            meshes: {
                mesh1 : {
                    primitives: [
                        {
                            material: 'material1'
                        }
                    ]
                }
            },
            materials: {
                material1: {
                    extensions : {
                        KHR_materials_common : {
                            technique : 'BLINN'
                        }
                    }
                },
                material2: {
                    // Second unused material included for testing purposes
                    extensions : {
                        KHR_materials_common : {
                            technique : 'BLINN'
                        }
                    }
                }
            },
            nodes: {
                node1: {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'ambientLight'
                        }
                    }
                },
                node2: {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'directionalLight'
                        }
                    }
                },
                node3: {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'pointLight'
                        }
                    }
                },
                node4: {
                    children: [],
                    extensions: {
                        KHR_materials_common: {
                            light: 'spotLight'
                        }
                    }
                }

            },
            extensionsUsed: [
                'KHR_materials_common'
            ],
            extensions: {
                KHR_materials_common : {
                    lights: {
                        ambientLight: {
                            ambient: {
                                color: [1.0, 1.0, 1.0]
                            },
                            type: 'ambient'
                        },
                        directionalLight: {
                            directional: {
                                color: [1.0, 1.0, 1.0]
                            },
                            type: 'directional'
                        },
                        pointLight: {
                            point: {
                                color: [1.0, 1.0, 1.0]
                            },
                            constantAttenuation: 0.0,
                            distance: 0.0,
                            linearAttenuation: 1.0,
                            quadraticAttenuation: 1.0,
                            type: 'point'
                        },
                        spotLight: {
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
                    }
                }
            }
        };
        var expectValues = {
            ambient: [0.0, 0.0, 0.0, 1.0],
            diffuse: [0.0, 0.0, 0.0, 1.0],
            emission: [0.0, 0.0, 0.0, 1.0],
            specular: [0.0, 0.0, 0.0, 1.0],
            shininess: 0.0,
            transparency: 1.0
        };
        addDefaults(gltf);
        addPipelineExtras(gltf);
        processModelMaterialsCommon(gltf);
        expect(Object.keys(gltf.materials).length > 0).toEqual(true);
        expect(Object.keys(gltf.techniques).length > 0).toEqual(true);
        for (var materialID in gltf.materials) {
            if (gltf.materials.hasOwnProperty(materialID)) {
                expect(gltf.materials[materialID].values).toEqual(expectValues);
            }
        }
    });

    it('works with optimizeForCesium', function() {
        var gltf = {
            extensionsUsed: ['KHR_materials_common'],
            meshes: {
                mesh1 : {
                    primitives: [
                        {
                            material: 'material1'
                        }
                    ]
                }
            },
            materials: {
                material1: {
                    extensions: {
                        KHR_materials_common: {
                            technique: 'BLINN',
                            ambient: [0.0, 0.0, 0.0, 1.0],
                            diffuse: [1.0, 0.0, 0.0, 1.0],
                            emission: 'texture_file2'
                        }
                    }
                }
            }
        };

        var gltfClone = clone(gltf, true);
        var options = {
            optimizeForCesium : true
        };
        addDefaults(gltfClone, options);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone, options);

        // Uses the Cesium sun as its default light source
        var fragmentShaderSource = gltfClone.shaders.fragmentShader0.extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(true);

        // Adds the _3DTILESDIFFUSE flag
        var technique = gltfClone.techniques[Object.keys(gltfClone.techniques)[0]];
        expect(technique.parameters.diffuse.semantic).toEqual('_3DTILESDIFFUSE');

        gltfClone = clone(gltf, true);
        addDefaults(gltfClone);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone);

        fragmentShaderSource = gltfClone.shaders.fragmentShader0.extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(false);
    });

    it('adds nonstandard semantic', function() {
        var gltf = {
            'accessors': {
                'accessor_3': {
                    'componentType': 5123,
                    'type': 'SCALAR'
                }
            },
            'extensionsUsed': [
                'KHR_materials_common'
            ],
            'meshes': {
                'mesh1' : {
                    'primitives': [
                        {
                            'attributes': {
                                'NORMAL': 'accessor_1',
                                'POSITION': 'accessor_2',
                                'BATCHID': 'accessor_3'
                            },
                            'indices': 'accessor_4',
                            'material': 'material1',
                            'mode': 4
                        }
                    ]
                }
            },
            'materials': {
                'material1': {
                    'extensions': {
                        'KHR_materials_common': {
                            'doubleSided': false,
                            'jointCount': 0,
                            'technique': 'PHONG',
                            'transparent': false,
                            'values': {
                                'diffuse': [
                                    0.4,
                                    0.4,
                                    0.4,
                                    1
                                ]
                            }
                        }
                    },
                    'name': 'material1'
                }
            }
        };

        var gltfClone = clone(gltf);
        addDefaults(gltfClone);
        addPipelineExtras(gltfClone);
        processModelMaterialsCommon(gltfClone);

        var material = gltfClone.materials.material1;
        var technique = gltfClone.techniques[material.technique];
        expect(technique.attributes.a_batchid).toEqual('batchid');
        expect(technique.parameters.batchid.semantic).toEqual('BATCHID');

        var program = gltfClone.programs[technique.program];
        expect(program.attributes.indexOf('a_batchid') > -1).toBe(true);

        var vertexShaderSource = gltfClone.shaders[program.vertexShader].extras._pipeline.source;
        expect(vertexShaderSource.indexOf('a_batchid') > -1).toBe(true);
    });

    it('splits two materials with different types for JOINT and WEIGHT', function() {
        var gltf = {
            accessors: {
                jointAccessor_0: {
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC4'
                },
                weightAccessor_0: {
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC4'
                },
                jointAccessor_1: {
                    componentType: WebGLConstants.FLOAT,
                    type: 'MAT3'
                },
                weightAccessor_1: {
                    componentType: WebGLConstants.FLOAT,
                    type: 'MAT3'
                }
            },
            extensionsUsed: [
                'KHR_materials_common'
            ],
            materials: {
                material: {
                    extensions: {
                        KHR_materials_common: {
                            jointCount: 14,
                            technique: 'BLINN'
                        }
                    }
                }
            },
            meshes: {
                meshVec4: {
                    primitives: [{
                        attributes: {
                            JOINT: 'jointAccessor_0',
                            WEIGHT: 'weightAccessor_0'
                        },
                        material: 'material'
                    }]
                },
                meshMat3: {
                    primitives: [{
                        attributes: {
                            JOINT: 'jointAccessor_1',
                            WEIGHT: 'weightAccessor_1'
                        },
                        material: 'material'
                    }]
                }
            }
        };
        addDefaults(gltf);
        addPipelineExtras(gltf);
        processModelMaterialsCommon(gltf);

        var meshes = gltf.meshes;
        var primitiveVec4 = meshes.meshVec4.primitives[0];
        var primitiveMat3 = meshes.meshMat3.primitives[0];
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
});
