'use strict';
var Cesium = require('cesium');

var updateVersion = require('../../lib/updateVersion');

var WebGLConstants = Cesium.WebGLConstants;

describe('updateVersion', function() {
    it('throws an error if gltf has no version', function() {
        var gltf = {};
        expect(function() {
            updateVersion(gltf);
        }).toThrowDeveloperError();
    });

    it('updates empty glTF with version from 0.8 to 1.1', function() {
        var gltf = {
            version: '0.8'
        };
        updateVersion(gltf);
        expect(gltf.version).not.toBeDefined();
        expect(gltf.asset.version).toBe('1.1');
    });

    it('updates empty glTF with version 1.0 to 1.1', function() {
        var gltf = {
            asset : {
                version: '1.0'
            }
        };
        updateVersion(gltf);
        expect(gltf.asset.version).toBe('1.1');
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
        expect(gltf.asset.version).toBe('1.0');
        expect(gltf.asset.profile).toEqual({});
        expect(gltf.version).not.toBeDefined();
        expect(gltf.extensionsUsed).toEqual(['extension']);
        var material = gltf.materials.material;
        expect(material.technique).toBe('technique');
        expect(material.values).toEqual({
            'ambient': [0.0, 0.0, 0.0, 1.0]
        });
        var primitive = gltf.meshes.mesh.primitives[0];
        expect(primitive.primitive).not.toBeDefined();
        expect(primitive.mode).toBe(WebGLConstants.TRIANGLES);
        var node = gltf.nodes.node;
        expect(node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(node.skeletons).toEqual(['skeleton']);
        expect(node.skin).toBe('skin');
        expect(node.meshes).toEqual(['mesh']);
        var technique = gltf.techniques.technique;
        expect(technique.pass).not.toBeDefined();
        expect(technique.passes).not.toBeDefined();
        expect(technique.attributes).toEqual({
            attribute: 'TEST_ATTRIBUTE'
        });
        expect(technique.program).toBe('program');
        expect(technique.uniforms).toEqual({
            uniform: 'TEST_UNIFORM'
        });
        expect(technique.states).toEqual(['TEST_STATE']);
    });

    it('updates glTF from 1.0 to 1.1', function() {
        var buffer = new Buffer(new Int16Array([-2.0, 1.0, 0.0, 1.0, 2.0, 3.0]).buffer);
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
            meshes: {
                mesh: {
                    primitives: [
                        {
                            attributes: {
                                TEXCOORD: 'accessor_texcoord',
                                COLOR: 'accessor_color'
                            }
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
                    parameters: {
                        lightAttenuation: {
                            value: 1.0
                        },
                        texcoord: {
                            semantic: 'TEXCOORD'
                        },
                        color: {
                            semantic: 'COLOR'
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
                }
            },
            bufferViews: {
                bufferView: {
                    buffer: 'buffer',
                    byteLength: buffer.length,
                    byteOffset: 0
                }
            },
            buffers: {
                buffer: {
                    byteLength: buffer.length,
                    extras: {
                        _pipeline: {
                            source: buffer
                        }
                    }
                }
            },
            nodes: {
                meshNode: {
                    meshes: ['mesh']
                },
                rootNode: {
                    children: ['jointNodeOne', 'jointNodeTwo', 'meshNode']
                },
                jointNodeOne: {
                    jointName: 'jointOne',
                    meshes: ['mesh']
                },
                jointNodeTwo: {
                    jointName: 'jointTwo',
                    translation: [1.0, 0.0, 0.0]
                }
            }
        };
        updateVersion(gltf, {
            targetVersion: '1.1'
        });
        expect(gltf.asset.profile.version).toEqual('1.0');
        var animation = gltf.animations.animation;
        var sampler = animation.samplers.sampler;
        expect(sampler.input).toBe('accessor_input');
        expect(sampler.output).toBe('accessor_output');
        expect(animation.parameters).not.toBeDefined();
        var material = gltf.materials.material;
        expect(material.values.shininess).toEqual([1.0]);
        var technique = gltf.techniques.technique;
        expect(technique.parameters.lightAttenuation.value).toEqual([1.0]);
        expect(technique.parameters.texcoord.semantic).toBe('TEXCOORD_0');
        expect(technique.parameters.color.semantic).toBe('COLOR_0');
        var accessor = gltf.accessors.accessor;
        expect(accessor.min).toEqual([-2.0]);
        expect(accessor.max).toEqual([3.0]);
        var primitive = gltf.meshes.mesh.primitives[0];
        expect(primitive.attributes.TEXCOORD).not.toBeDefined();
        expect(primitive.attributes.TEXCOORD_0).toBe('accessor_texcoord');
        expect(primitive.attributes.COLOR).not.toBeDefined();
        expect(primitive.attributes.COLOR_0).toBe('accessor_color');
        var nodes = gltf.nodes;
        var rootNode = nodes.rootNode;
        expect(rootNode.children).toEqual(['jointNodeOne', 'meshNode']);
        var rootNodeSkeleton = nodes['rootNode-skeleton'];
        expect(rootNodeSkeleton.matrix).toBeDefined();
        expect(rootNodeSkeleton.children).toEqual(['jointNodeTwo-skeleton', 'jointNodeOne-skeleton']);
        var jointNodeOneSkeleton = nodes['jointNodeOne-skeleton'];
        expect(jointNodeOneSkeleton.meshes).not.toBeDefined();
        var jointNodeOne = nodes.jointNodeOne;
        expect(jointNodeOne.meshes).toEqual(['mesh']);
        expect(jointNodeOne.jointName).not.toBeDefined();
        var jointNodeTwoSkeleton = nodes['jointNodeTwo-skeleton'];
        expect(jointNodeTwoSkeleton.translation).toEqual([1.0, 0.0, 0.0]);
        expect(nodes.jointNodeTwo).not.toBeDefined();
    });
});