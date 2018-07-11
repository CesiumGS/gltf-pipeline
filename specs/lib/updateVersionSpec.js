'use strict';
var Cesium = require('cesium');
var ForEach = require('../../lib/ForEach');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var readResources = require('../../lib/readResources');
var updateVersion = require('../../lib/updateVersion');

var Cartesian3 = Cesium.Cartesian3;
var Quaternion = Cesium.Quaternion;
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
        expect(gltf.version).toBeUndefined();
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates empty glTF with version 1.0 to 2.0', function() {
        var gltf = {
            asset: {
                version: '1.0'
            }
        };
        updateVersion(gltf);
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates a glTF with non-standard version to 2.0', function() {
        var gltf = {
            asset: {
                version: '1.0.1'
            }
        };
        updateVersion(gltf);
        expect(gltf.asset.version).toEqual('2.0');
    });

    it('updates glTF from 0.8 to 1.0', function(done) {
        var times = [0.0, 1.0];
        var axisA = new Cartesian3(0.0, 0.0, 1.0);
        var axisB = new Cartesian3(0.0, 1.0, 0.0);
        var angleA = 0.0;
        var angleB = 0.5;
        var quatA = Quaternion.fromAxisAngle(axisA, angleA);
        var quatB = Quaternion.fromAxisAngle(axisB, angleB);

        var originalBuffer = Buffer.from((new Float32Array([times[0], times[1], axisA.x, axisA.y, axisA.z, angleA, axisB.x, axisB.y, axisB.z, angleB])).buffer);
        var expectedBuffer = Buffer.from((new Float32Array([times[0], times[1], quatA.x, quatA.y, quatA.z, quatA.w, quatB.x, quatB.y, quatB.z, quatB.w])).buffer);

        var dataUri = 'data:application/octet-stream;base64,' + originalBuffer.toString('base64');

        var gltf = {
            version: '0.8',
            asset: {
                profile: 'WebGL 1.0'
            },
            allExtensions: [
                'extension'
            ],
            lights: {
                'someLight': true
            },
            buffers: {
                buffer: {
                    uri: dataUri
                }
            },
            bufferViews: {
                bufferViewTime: {
                    buffer: 'buffer',
                    byteLength: 8,
                    byteOffset: 0
                },
                bufferViewRotation: {
                    buffer: 'buffer',
                    byteLength: 32,
                    byteOffset: 8
                }
            },
            accessors: {
                accessorTime: {
                    bufferView: "bufferViewTime",
                    byteOffset: 0,
                    byteStride: 0,
                    componentType: WebGLConstants.FLOAT,
                    count: 2,
                    type: 'SCALAR'
                },
                accessorRotation: {
                    bufferView: "bufferViewRotation",
                    byteOffset: 0,
                    byteStride: 0,
                    componentType: WebGLConstants.FLOAT,
                    count: 2,
                    type: 'VEC4'
                }
            },
            animations: {
                animationNode: {
                    channels: [
                        {
                            sampler: 'sampler',
                            target: {
                                id: 'node',
                                path: 'rotation'
                            }
                        }
                    ],
                    count: 2,
                    parameters: {
                        time: 'accessorTime',
                        rotation: 'accessorRotation'
                    },
                    samplers: {
                        sampler: {
                            input: 'time',
                            interpolation: 'LINEAR',
                            output: 'rotation'
                        }
                    }
                },
                animationNodeOther: {
                    channels: [
                        {
                            sampler: 'sampler',
                            target: {
                                id: 'nodeOther',
                                path: 'rotation'
                            }
                        }
                    ],
                    count: 2,
                    parameters: {
                        time: 'accessorTime',
                        rotation: 'accessorRotation'
                    },
                    samplers: {
                        sampler: {
                            input: 'time',
                            interpolation: 'LINEAR',
                            output: 'rotation'
                        }
                    }
                }
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
                },
                nodeOther: {
                    rotation: [0.0, 0.0, 1.0, 0.0]
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

        expect(readResources(gltf)
            .then(function(gltf) {
                updateVersion(gltf, {
                    targetVersion: '1.0'
                });

                // Asset updates: version set to 1.0, profile split into object
                expect(gltf.asset.version).toEqual('1.0');
                expect(gltf.asset.profile).toEqual({
                    api: 'WebGL',
                    version: '1.0'
                });

                // Top-level version removed
                expect(gltf.version).toBeUndefined();

                // allExtensions renamed to extensionsUsed
                // gltf.lights moved to KHR_materials_common extension
                expect(gltf.extensionsUsed).toEqual(['extension', 'KHR_materials_common']);
                expect(gltf.allExtensions).toBeUndefined();
                expect(gltf.extensions.KHR_materials_common.lights).toEqual({
                    someLight: true
                });

                // material.instanceTechnique properties moved onto the material directly
                var material = gltf.materials.material;
                expect(material.technique).toEqual('technique');
                expect(material.values).toEqual({
                    ambient: [0.0, 0.0, 0.0, 1.0]
                });

                // primitive.primitive renamed to primitive.mode
                var primitive = gltf.meshes.mesh.primitives[0];
                expect(primitive.primitive).toBeUndefined();
                expect(primitive.mode).toEqual(WebGLConstants.TRIANGLES);

                // node.instanceSkin is split into node.skeletons, node.skin, and node.meshes
                var node = gltf.nodes.node;
                expect(node.skeletons).toEqual(['skeleton']);
                expect(node.skin).toEqual('skin');
                expect(node.meshes).toEqual(['mesh']);

                // Node rotation converted from axis-angle to quaternion
                expect(node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);

                // Technique pass and passes removed
                var technique = gltf.techniques.technique;
                expect(technique.pass).toBeUndefined();
                expect(technique.passes).toBeUndefined();
                expect(technique.attributes).toEqual({
                    attribute: 'TEST_ATTRIBUTE'
                });
                expect(technique.program).toEqual('program');
                expect(technique.uniforms).toEqual({
                    uniform: 'TEST_UNIFORM'
                });
                expect(technique.states).toEqual(['TEST_STATE']);

                // Animation rotations converted from axis-angle to quaternion
                var buffer = gltf.buffers.buffer.extras._pipeline.source;
                expect(buffer.equals(expectedBuffer)).toBe(true);
            }), done).toResolve();
    });

    function getNodeByName(gltf, name) {
        var nodeWithName;
        ForEach.node(gltf, function(node) {
            if (node.name === name) {
                nodeWithName = node;
            }
        });
        return nodeWithName;
    }

    it('updates glTF from 1.0 to 2.0', function(done) {
        var source = Buffer.from((new Int16Array([-2.0, 1.0, 0.0, 1.0, 2.0, 3.0])).buffer);
        var dataUri = 'data:application/octet-stream;base64,' + source.toString('base64');

        var gltf = {
            asset: {
                profile: {
                    api: 'WebGL',
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
                                POSITION: 'accessor_position',
                                NORMAL: 'accessor_normal',
                                TEXCOORD: 'accessor_texcoord',
                                COLOR: 'accessor_color',
                                JOINT: 'accessor_joint',
                                WEIGHT: 'accessor_weight',
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
                    technique: 'technique',
                    values: {
                        lightAttenuation: 2.0
                    }
                }
            },
            techniques: {
                technique: {
                    states: {
                        enable: [
                            WebGLConstants.SCISSOR_TEST,
                            WebGLConstants.BLEND,
                            WebGLConstants.CULL_FACE
                        ],
                        functions: {
                            blendColor: [-1.0, 0.0, 0.0, 2.0],
                            blendEquationSeparate: [
                                WebGLConstants.FUNC_SUBTRACT,
                                WebGLConstants.FUNC_SUBTRACT
                            ],
                            depthRange: [1.0, -1.0],
                            scissor: [0.0, 0.0, 0.0, 0.0]
                        }
                    },
                    attributes: {
                        a_application: 'application',
                        a_joints : 'joints',
                        a_weights : 'weights'
                    },
                    uniforms: {
                        u_lightAttenuation: 'lightAttenuation',
                        u_texcoord: 'texcoord',
                        u_color: 'color',
                        u_application: 'application',
                        u_jointMatrix: 'jointMatrix'
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
                        joints: {
                            semantic: 'JOINT'
                        },
                        weights: {
                            semantic: 'WEIGHT'
                        },
                        application: {
                            semantic: 'APPLICATIONSPECIFIC',
                            count: 1,
                            value: 2
                        },
                        jointMatrix: {
                            semantic: 'JOINTMATRIX',
                            count: 2
                        }
                    },
                    program: 'program_0'
                }
            },
            accessors: {
                accessor: {
                    byteOffset: 0,
                    bufferView: 'bufferView',
                    componentType: WebGLConstants.SHORT,
                    count: 6,
                    type: 'SCALAR'
                },
                accessor_indices: {
                    componentType: WebGLConstants.UNSIGNED_INT,
                    count: 3,
                    type: 'SCALAR'
                },
                accessor_input: {
                    componentType: WebGLConstants.FLOAT,
                    count: 1,
                    type: 'SCALAR'
                },
                accessor_output: {
                    componentType: WebGLConstants.FLOAT,
                    count: 1,
                    type: 'VEC3'
                },
                accessor_position: {
                    bufferView: 'bufferViewAttributes',
                    byteOffset: 0,
                    componentType: WebGLConstants.FLOAT,
                    count: 3,
                    type: 'VEC3'
                },
                accessor_normal: {
                    bufferView: 'bufferViewAttributes',
                    byteOffset: 36,
                    componentType: WebGLConstants.FLOAT,
                    count: 3,
                    type: 'VEC3'
                },
                accessor_texcoord: {
                    bufferView: 'bufferViewAttributes',
                    byteOffset: 72,
                    componentType: WebGLConstants.FLOAT,
                    count: 3,
                    type: 'VEC2'
                },
                accessor_color: {
                    componentType: WebGLConstants.FLOAT,
                    count: 3,
                    type: 'VEC3'
                },
                accessor_joint: {
                    componentType: WebGLConstants.FLOAT,
                    count: 1,
                    type: 'SCALAR'
                },
                accessor_weight: {
                    componentType: WebGLConstants.FLOAT,
                    count: 1,
                    type: 'SCALAR'
                },
                accessor_temperature: {
                    componentType: WebGLConstants.FLOAT,
                    count: 2,
                    type: 'SCALAR'
                }
            },
            bufferViews: {
                bufferView: {
                    buffer: 'buffer',
                    byteOffset: 96
                },
                bufferViewAttributes: {
                    buffer: 'buffer',
                    byteOffset: 12
                }
            },
            buffers: {
                buffer: {
                    type: 'arraybuffer',
                    uri: dataUri
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
                },
                nodeWithoutChildren: {
                    children: []
                }
            },
            programs: {
                program_0: {
                    attributes: [
                        'a_application',
                        'a_joints',
                        'a_weights'
                    ],
                    fragmentShader: 'fs',
                    vertexShader: 'vs'
                }
            },
            samplers: [],
            scene: 'defaultScene',
            scenes: {
                defaultScene: {
                    nodes: [
                        'rootTransform'
                    ]
                }
            },
            shaders: {
                fs: {
                    type: 35632,
                    uri: 'data:,'
                },
                vs: {
                    type: 35633,
                    uri: 'data:,'
                }
            },
            skins: {
                someSkin: {}
            },
            textures: [
                {
                    source: 0,
                    format: WebGLConstants.RGBA,
                    internalFormat: WebGLConstants.RGBA,
                    target: WebGLConstants.TEXTURE_2D,
                    type: WebGLConstants.UNSIGNED_BYTE
                }
            ]
        };

        expect(readResources(gltf)
            .then(function(gltf) {
                updateVersion(gltf);

                // Asset updates: version set to 2.0, profile removed
                expect(gltf.asset.version).toEqual('2.0');
                expect(gltf.asset.profile).toBeUndefined();

                // Extensions used become extensions required
                var extensionsUsed = gltf.extensionsUsed;
                expect(extensionsUsed).toEqual([
                    'KHR_materials_common',
                    'WEB3D_quantized_attributes',
                    'UNKOWN_EXTENSION',
                    'EXT_blend',
                    'KHR_techniques_webgl'
                ]);
                var extensionsRequired = gltf.extensionsRequired;
                expect(extensionsRequired).toEqual([
                    'KHR_materials_common',
                    'WEB3D_quantized_attributes',
                    'KHR_techniques_webgl'
                ]);

                // animation.parameters removed
                var animation = gltf.animations[0];
                var sampler = animation.samplers[0];
                expect(sampler.input).toEqual(2);
                expect(sampler.output).toEqual(3);
                expect(animation.parameters).toBeUndefined();

                // Empty arrays removed
                expect(gltf.samplers).toBeUndefined();
                expect(getNodeByName(gltf, 'nodeWithoutChildren').children).toBeUndefined();

                // Expect material values to be moved to material KHR_techniques_webgl extension
                var material = gltf.materials[0];
                expect(material.extensions.KHR_techniques_webgl.values.u_lightAttenuation).toEqual(2);

                // Expect material paramters to be updated
                expect(material.doubleSided).toBeUndefined();
                expect(material.alphaMode).toBe('BLEND');

                // Expect technique blending to be moved to material EXT_blend extension
                var materialBlending = material.extensions.EXT_blend;
                expect(materialBlending).toBeDefined();
                expect(materialBlending.blendEquation).toEqual([
                    WebGLConstants.FUNC_SUBTRACT,
                    WebGLConstants.FUNC_SUBTRACT
                ]);
                expect(materialBlending.blendFactors).toEqual([
                    WebGLConstants.ONE,
                    WebGLConstants.ZERO,
                    WebGLConstants.ONE,
                    WebGLConstants.ZERO
                ]);

                // Expect techniques to be moved to asset KHR_techniques_webgl extension
                var technique = gltf.extensions.KHR_techniques_webgl.techniques[0];
                expect(technique.uniforms.u_lightAttenuation.value).toEqual(1.0);
                expect(technique.attributes.a_application.value).toBeUndefined();

                // TEXCOORD and COLOR are now TEXCOORD_0 and COLOR_0
                var primitive = gltf.meshes[0].primitives[0];
                expect(technique.uniforms.u_texcoord.semantic).toEqual('TEXCOORD_0');
                expect(technique.uniforms.u_color.semantic).toEqual('COLOR_0');
                expect(primitive.attributes.TEXCOORD).toBeUndefined();
                expect(primitive.attributes.TEXCOORD_0).toEqual(6);
                expect(primitive.attributes.COLOR).toBeUndefined();
                expect(primitive.attributes.COLOR_0).toEqual(7);

                // JOINT is now JOINTS_0 and WEIGHT is not WEIGHTS_0
                expect(technique.attributes.a_joints.semantic).toEqual('JOINTS_0');
                expect(technique.attributes.a_weights.semantic).toEqual('WEIGHTS_0');
                expect(primitive.attributes.JOINT).toBeUndefined();
                expect(primitive.attributes.JOINTS_0).toEqual(8);
                expect(primitive.attributes.WEIGHT).toBeUndefined();
                expect(primitive.attributes.WEIGHTS_0).toEqual(9);

                // Underscore added to application specific attributes
                expect(technique.attributes.a_application.semantic).toEqual('_APPLICATIONSPECIFIC');
                expect(primitive.attributes.APPLICATIONSPECIFIC).toBeUndefined();
                expect(primitive.attributes._APPLICATIONSPECIFIC).toEqual(0);
                expect(primitive.attributes._TEMPERATURE).toEqual(10);

                // Clamp camera parameters
                var camera = gltf.cameras[0];
                expect(camera.perspective.aspectRatio).toBeUndefined();
                expect(camera.perspective.yfov).toEqual(1.0);

                // Sets byteLength for buffers and bufferViews
                var buffer = gltf.buffers[0];
                expect(buffer.type).toBeUndefined();
                expect(buffer.byteLength).toEqual(source.length);
                var bufferView = gltf.bufferViews[0];
                expect(bufferView.byteLength).toEqual(source.length);

                // Min and max are added to all POSITION accessors
                ForEach.accessorWithSemantic(gltf, 'POSITION', function(accessorId) {
                    var accessor = gltf.accessors[accessorId];
                    expect(accessor.min.length).toEqual(numberOfComponentsForType(accessor.type));
                    expect(accessor.max.length).toEqual(numberOfComponentsForType(accessor.type));
                });

                // byteStride moved from accessor to bufferView
                var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
                var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
                var texcoordAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
                var positionBufferView = gltf.bufferViews[positionAccessor.bufferView];
                var texcoordBufferView = gltf.bufferViews[texcoordAccessor.bufferView];
                expect(positionAccessor.bufferView).toBe(1);
                expect(normalAccessor.bufferView).toBe(1);
                expect(texcoordAccessor.bufferView).toBe(2);
                expect(positionBufferView.byteLength).toBe(72);
                expect(positionBufferView.byteOffset).toBe(12); // First unrelated buffer view is 12 bytes
                expect(positionBufferView.byteStride).toBe(12);
                expect(texcoordBufferView.byteLength).toBe(24);
                expect(texcoordBufferView.byteOffset).toBe(72 + 12); // First unrelated buffer view is 12 bytes
                expect(texcoordBufferView.byteStride).toBe(8);
                expect(positionAccessor.byteStride).toBeUndefined();
                expect(normalAccessor.byteStride).toBeUndefined();
                expect(texcoordAccessor.byteStride).toBeUndefined();
            }), done).toResolve();
    });
});
