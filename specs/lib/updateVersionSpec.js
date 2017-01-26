'use strict';
var Cesium = require('cesium');

var updateVersion = require('../../lib/updateVersion');

var WebGLConstants = Cesium.WebGLConstants;

describe('updateVersion', function() {
    it('defaults to 1.0 if gltf has no version', function() {
        var gltf = {};
        updateVersion(gltf, {
            targetVersion: '1.0'
        });
        expect(gltf.asset.version).toEqual('1.0');
    });

    it('updates empty glTF with version from 0.8 to 2.0', function() {
        var gltf = {
            version: '0.8'
        };
        updateVersion(gltf);
        expect(gltf.version).not.toBeDefined();
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates empty glTF with version 1.0 to 2.0', function() {
        var gltf = {
            asset : {
                version: '1.0'
            }
        };
        updateVersion(gltf);
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates a glTF with non-standard version to 2.0', function() {
        var gltf = {
            asset : {
                version: '1.0.1'
            }
        };
        updateVersion(gltf);
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates glTF from 0.8 to 1.0', function() {
        var gltf = {
            version: '0.8',
            asset: {
                profile: 'WebGL 1.0'
            },
            allExtensions: [
                'extension'
            ],
            lights : {
                'someLight' : true
            },
            materials: {
                material: {
                    instanceTechnique: {
                        technique: 'technique',
                        values: {
                            ambient: [0.0, 0.0, 0.0, 1.0]
                        }
                    }
                }
            },
            meshes: {
                mesh: {
                    primitives: [
                        {
                            primitive: WebGLConstants.TRIANGLES
                        }
                    ]
                }
            },
            nodes: {
                node: {
                    rotation: [0.0, 0.0, 1.0, 0.0],
                    instanceSkin: {
                        skeletons: ['skeleton'],
                        skin: 'skin',
                        meshes: ['mesh']
                    }
                }
            },
            techniques: {
                technique: {
                    pass: 'pass',
                    passes: {
                        pass: {
                            instanceProgram: {
                                attributes: {
                                    attribute: 'TEST_ATTRIBUTE'
                                },
                                program: 'program',
                                uniforms: {
                                    uniform: 'TEST_UNIFORM'
                                }
                            },
                            states: ['TEST_STATE']
                        }
                    }
                }
            }
        };
        updateVersion(gltf, {
            targetVersion: '1.0'
        });
        expect(gltf.asset.version).toEqual('1.0');
        expect(gltf.asset.profile).toEqual({});
        expect(gltf.version).not.toBeDefined();
        expect(gltf.extensionsUsed).toEqual(['extension']);
        expect(gltf.extensions.KHR_materials_common.lights).toEqual({
            someLight : true
        });
        var material = gltf.materials.material;
        expect(material.technique).toEqual('technique');
        expect(material.values).toEqual({
            'ambient': [0.0, 0.0, 0.0, 1.0]
        });
        var primitive = gltf.meshes.mesh.primitives[0];
        expect(primitive.primitive).not.toBeDefined();
        expect(primitive.mode).toEqual(WebGLConstants.TRIANGLES);
        var node = gltf.nodes.node;
        expect(node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(node.skeletons).toEqual(['skeleton']);
        expect(node.skin).toEqual('skin');
        expect(node.meshes).toEqual(['mesh']);
        var technique = gltf.techniques.technique;
        expect(technique.pass).not.toBeDefined();
        expect(technique.passes).not.toBeDefined();
        expect(technique.attributes).toEqual({
            attribute: 'TEST_ATTRIBUTE'
        });
        expect(technique.program).toEqual('program');
        expect(technique.uniforms).toEqual({
            uniform: 'TEST_UNIFORM'
        });
        expect(technique.states).toEqual(['TEST_STATE']);
    });

    it('updates glTF from 1.0 to 2.0', function() {
        var arrayBuffer = new Buffer(new Int16Array([-2.0, 1.0, 0.0, 1.0, 2.0, 3.0]).buffer);
        var gltf = {
            asset: {
                profile: {
                    version: '1.0.3'
                },
                version: '1.0'
            },
            animations: {
                animation: {
                    samplers: {
                        sampler: {
                            input: 'INPUT',
                            output: 'OUTPUT'
                        }
                    },
                    parameters: {
                        INPUT: 'accessor_input',
                        OUTPUT: 'accessor_output'
                    }
                }
            },
            extensionsUsed: [
                'KHR_materials_common',
                'WEB3D_quantized_attributes',
                'UNKOWN_EXTENSION'
            ],
            meshes: {
                mesh: {
                    primitives: [
                        {
                            attributes: {
                                TEXCOORD: 'accessor_texcoord',
                                COLOR: 'accessor_color',
                                APPLICATIONSPECIFIC: 'accessor',
                                _TEMPERATURE: 'accessor_temperature'
                            },
                            indices: 'accessor_indices'
                        }
                    ]
                }
            },
            materials: {
                material: {
                    values: {
                        shininess: 1.0
                    }
                }
            },
            techniques: {
                technique: {
                    states: {
                        enable: [ WebGLConstants.SCISSOR_TEST ],
                        functions: {
                            blendColor: [-1.0, 0.0, 0.0, 2.0],
                            depthRange: [1.0, -1.0],
                            scissor: [0.0, 0.0, 0.0, 0.0]
                        }
                    },
                    attributes: {
                        a_application: 'application'
                    },
                    parameters: {
                        lightAttenuation: {
                            value: 1.0
                        },
                        texcoord: {
                            semantic: 'TEXCOORD'
                        },
                        color: {
                            semantic: 'COLOR'
                        },
                        application: {
                            semantic: 'APPLICATIONSPECIFIC',
                            count: 1,
                            value: 2
                        },
                        jointMatrix: {
                            semantic: 'JOINTMATRIX',
                            count: 2
                        },
                        notJointMatrix: {
                            count: 3
                        },
                        notJointMatrixWithSemantic: {
                            count: 4
                        }
                    }
                }
            },
            accessors: {
                accessor: {
                    byteOffset: 0,
                    byteStride: 0,
                    bufferView: 'bufferView',
                    componentType: WebGLConstants.SHORT,
                    count: 6,
                    type: 'SCALAR'
                },
                accessor_indices: {
                    componentType: WebGLConstants.UNSIGNED_INT
                }
            },
            bufferViews: {
                bufferView: {
                    buffer: 'buffer',
                    byteOffset: 0
                }
            },
            buffers: {
                buffer: {
                    type: 'arraybuffer',
                    extras: {
                        _pipeline: {
                            source: arrayBuffer
                        }
                    }
                }
            },
            cameras: {
                camera: {
                    perspective: {
                        aspectRatio: 0.0,
                        yfov: 0.0
                    }
                }
            },
            nodes: {
                rootTransform: {
                    children: [
                        'skeletonNode',
                        'meshNode'
                    ],
                    matrix: [
                        1, 0,  0, 0,
                        0, 0, -1, 0,
                        0, 1,  0, 0,
                        0, 0,  0, 1
                    ]
                },
                skeletonNode: {},
                meshNode: {
                    skin: 'someSkin',
                    skeletons: [
                        'skeletonNode'
                    ]
                }
            },
            scene: 'defaultScene',
            scenes: {
                defaultScene: {
                    nodes: [
                        'rootTransform'
                    ]
                }
            }
        };
        updateVersion(gltf, {
            targetVersion: '1.1'
        });
        expect(gltf.asset.profile.version).toEqual('1.0');
        var extensionsUsed = gltf.extensionsUsed;
        expect(extensionsUsed).toEqual([
            'KHR_materials_common',
            'WEB3D_quantized_attributes',
            'UNKOWN_EXTENSION'
        ]);
        var extensionsRequired = gltf.extensionsRequired;
        expect(extensionsRequired).toEqual([
            'KHR_materials_common',
            'WEB3D_quantized_attributes'
        ]);
        var glExtensionsUsed = gltf.glExtensionsUsed;
        expect(glExtensionsUsed).toEqual(['OES_element_index_uint']);
        var animation = gltf.animations.animation;
        var sampler = animation.samplers.sampler;
        expect(sampler.input).toEqual('accessor_input');
        expect(sampler.output).toEqual('accessor_output');
        expect(animation.parameters).not.toBeDefined();
        var material = gltf.materials.material;
        expect(material.values.shininess).toEqual([1.0]);
        var technique = gltf.techniques.technique;
        expect(technique.parameters.lightAttenuation.value).toEqual([1.0]);
        expect(technique.parameters.application.value).not.toBeDefined();
        expect(technique.parameters.texcoord.semantic).toEqual('TEXCOORD_0');
        expect(technique.parameters.color.semantic).toEqual('COLOR_0');
        expect(technique.parameters.application.semantic).toEqual('_APPLICATIONSPECIFIC');
        var states = technique.states;
        expect(states.enable).toEqual([]);
        expect(states.functions.scissor).not.toBeDefined();
        expect(states.functions.blendColor).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(states.functions.depthRange).toEqual([0.0, 0.0]);
        var accessor = gltf.accessors.accessor;
        expect(accessor.min).toEqual([-2.0]);
        expect(accessor.max).toEqual([3.0]);
        var primitive = gltf.meshes.mesh.primitives[0];
        expect(primitive.attributes.TEXCOORD).not.toBeDefined();
        expect(primitive.attributes.TEXCOORD_0).toEqual('accessor_texcoord');
        expect(primitive.attributes.COLOR).not.toBeDefined();
        expect(primitive.attributes.COLOR_0).toEqual('accessor_color');
        expect(primitive.attributes.APPLICATIONSPECIFIC).not.toBeDefined();
        expect(primitive.attributes._APPLICATIONSPECIFIC).toEqual('accessor');
        expect(primitive.attributes._TEMPERATURE).toEqual('accessor_temperature');
        var rootTransform = gltf.nodes.rootTransform;
        var rootSkeletonNode = gltf.nodes['root-skeletonNode'];
        var scene = gltf.scenes.defaultScene;
        expect(scene.nodes).toEqual(['rootTransform', 'root-skeletonNode']);
        expect(rootTransform.children).toEqual(['meshNode']);
        expect(rootSkeletonNode.matrix).toEqual(rootTransform.matrix);
        var camera = gltf.cameras.camera;
        expect(camera.perspective.aspectRatio).not.toBeDefined();
        expect(camera.perspective.yfov).toEqual(1.0);
        var buffer = gltf.buffers.buffer;
        expect(buffer.type).not.toBeDefined();
        expect(buffer.byteLength).toEqual(arrayBuffer.length);
        var bufferView = gltf.bufferViews.bufferView;
        expect(bufferView.byteLength).toEqual(arrayBuffer.length);
        expect(technique.parameters.application.count).toEqual(1);
        expect(technique.parameters.jointMatrix.count).toEqual(2);
        expect(technique.parameters.notJointMatrix.count).not.toBeDefined();
        expect(technique.parameters.notJointMatrixWithSemantic.count).not.toBeDefined();
    });

    it('does not add glExtensionsUsed if primitive indices are not UNSIGNED_INT', function() {
       var gltf = {
           asset: {
               version: '1.0'
           },
           accessors: {
               indices_accessor: {
                   componentType: WebGLConstants.UNSIGNED_SHORT
               }
           },
           meshes : {
               mesh : {
                   primitives : [
                       {
                           indices: 'indices_accessor'
                       }
                   ]
               }
           }
       };
       updateVersion(gltf);
       expect(gltf.asset.version).toEqual('2.0');
       expect(gltf.glExtensionsUsed).not.toBeDefined();
    });
});