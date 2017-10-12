'use strict';
var Cesium = require('cesium');

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

    it('updates empty glTF with version from 0.8 to 1.0', function() {
        var gltf = {
            version: '0.8'
        };
        updateVersion(gltf);
        expect(gltf.version).not.toBeDefined();
        expect(gltf.asset.version).toEqual('1.0');
    });

    it('updates glTF from 0.8 to 1.0', function() {
        var times = [0.0, 1.0];
        var axisA = new Cartesian3(0.0, 0.0, 1.0);
        var axisB = new Cartesian3(0.0, 1.0, 0.0);
        var angleA = 0.0;
        var angleB = 0.5;
        var quatA = Quaternion.fromAxisAngle(axisA, angleA);
        var quatB = Quaternion.fromAxisAngle(axisB, angleB);

        var originalBuffer = new Float32Array([times[0], times[1], axisA.x, axisA.y, axisA.z, angleA, axisB.x, axisB.y, axisB.z, angleB]);
        var expectedBuffer = new Float32Array([times[0], times[1], quatA.x, quatA.y, quatA.z, quatA.w, quatB.x, quatB.y, quatB.z, quatB.w]);

        var buffer = new Uint8Array(originalBuffer.buffer);

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
            buffers: {
                buffer: {
                    byteLength: buffer.byteLength,
                    type: 'arraybuffer',
                    extras: {
                        _pipeline: {
                            source: buffer
                        }
                    }
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

        expect(originalBuffer).toEqual(expectedBuffer);
    });
});
