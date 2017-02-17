'use strict';
var Promise = require('bluebird');
var fs = require('fs-extra');
var RemoveUnusedProperties = require('../../lib/RemoveUnusedProperties');

var fsReadFile = Promise.promisify(fs.readFile);

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestUnusedTree.gltf';

describe('RemoveUnusedProperties', function() {
    var removeNodes = RemoveUnusedProperties.removeNodes;
    describe('removeNodes', function () {
        it('removes an isolated node', function () {
            var gltf = {
                nodes: [
                    {
                        children: [
                            1,
                            2
                        ],
                        name: 'node_3'
                    },
                    {
                        name: 'left_node'
                    },
                    {
                        children: [
                            3
                        ],
                        name: 'right_node'
                    },
                    {
                        name: 'txtrLocator026Node'
                    },
                    {
                        name: 'unusedNodeId'
                    }
                ],
                scenes: [
                    {
                        nodes: [
                            0
                        ]
                    }
                ]
            };
            removeNodes(gltf);
            var nodes = gltf.nodes;
            expect(nodes.length).toEqual(4);
            expect(nodes[0].name).toEqual('node_3');
            expect(nodes[1].name).toEqual('left_node');
            expect(nodes[2].name).toEqual('right_node');
            expect(nodes[3].name).toEqual('txtrLocator026Node');
        });

        it('removes an unused tree', function () {
            var gltf = {
                nodes: [
                    {
                        children: [
                            1,
                            2
                        ],
                        name: 'node_3'
                    },
                    {
                        name: 'left_node'
                    },
                    {
                        children: [
                            3
                        ],
                        name: 'right_node'
                    },
                    {
                        name: 'txtrLocator026Node'
                    }
                ],
                scenes: [
                    {}
                ]
            };

            removeNodes(gltf);
            expect(gltf.nodes.length).toEqual(0);
        });

        it('removes an extra tree', function () {
            var gltf = {
                nodes: [
                    {
                        children: [
                            1,
                            2
                        ],
                        name: 'node_3'
                    },
                    {
                        name: 'left_node'
                    },
                    {
                        children: [
                            3
                        ],
                        name: 'right_node'
                    },
                    {
                        name: 'txtrLocator026Node'
                    },
                    {
                        children: [
                            5, 6
                        ],
                        name: 'unusedRootId'
                    },
                    {
                        name: 'unusedLeftId'
                    },
                    {
                        children: [
                            7
                        ],
                        name: 'unusedRightId'
                    },
                    {
                        name: 'unusedChildId'
                    }
                ],
                scenes: [
                    {
                        nodes: [
                            0
                        ]
                    }
                ]
            };
            removeNodes(gltf);
            var nodes = gltf.nodes;
            expect(nodes.length).toEqual(4);
            expect(nodes[0].name).toEqual('node_3');
            expect(nodes[1].name).toEqual('left_node');
            expect(nodes[2].name).toEqual('right_node');
            expect(nodes[3].name).toEqual('txtrLocator026Node');
        });

        it('does not remove any nodes', function () {
            var gltf = {
                nodes: [
                    {
                        children: [
                            1,
                            2
                        ],
                        name: 'node_3'
                    },
                    {
                        name: 'left_node'
                    },
                    {
                        children: [
                            3
                        ],
                        name: 'right_node'
                    },
                    {
                        name: 'txtrLocator026Node'
                    }
                ],
                scenes: [
                    {
                        nodes: [
                            0
                        ]
                    }
                ]
            };
            removeNodes(gltf);
            var nodes = gltf.nodes;
            expect(nodes.length).toEqual(4);
            expect(nodes[0].name).toEqual('node_3');
            expect(nodes[1].name).toEqual('left_node');
            expect(nodes[2].name).toEqual('right_node');
            expect(nodes[3].name).toEqual('txtrLocator026Node');
        });
    });

    var removeSkins = RemoveUnusedProperties.removeSkins;
    describe('removeSkins', function () {
        it('removes a skin', function () {
            var gltf = {
                nodes: [
                    {
                        skin: 0
                    }
                ],
                skins: [
                    {
                        inverseBindMatrices: 0,
                        jointNames: [
                            'Bone'
                        ],
                        name: 'used'
                    },
                    {
                        name: 'unused'
                    }
                ]
            };
            removeSkins(gltf);
            var skins = gltf.skins;
            expect(skins.length).toEqual(1);
            expect(skins[0].name).toEqual('used');
        });

        it('does not remove any skins', function () {
            var gltf = {
                nodes: [
                    {
                        skin: 0
                    }
                ],
                skins: [
                    {
                        name: 'usedSkin'
                    }
                ]
            };
            removeSkins(gltf);
            var skins = gltf.skins;
            expect(skins.length).toEqual(1);
            expect(skins[0].name).toEqual('usedSkin');
        });
    });

    var removeCameras = RemoveUnusedProperties.removeCameras;
    describe('removeCameras', function () {
        it('removes a camera', function () {
            var gltf = {
                cameras: [
                    {
                        perspective: {
                            aspectRatio: 1.5,
                            yfov: 0.660593,
                            zfar: 100,
                            znear: 0.01
                        },
                        type: 'perspective'
                    },
                    {
                        perspective: {
                            aspectRatio: 1.5,
                            yfov: 0.660593,
                            zfar: 100,
                            znear: 0.01
                        },
                        type: 'perspective',
                        name: 'usedCamera'
                    }
                ],
                nodes: [
                    {
                        camera: 1
                    }
                ]
            };
            removeCameras(gltf);
            expect(gltf.cameras.length).toEqual(1);
            expect(gltf.cameras[0].name).toEqual('usedCamera');
            expect(gltf.nodes[0].camera).toEqual(0);
        });

        it('does not remove any cameras', function() {
            var gltf = {
                cameras: [
                    {
                        perspective: {
                            aspectRatio: 1.5,
                            yfov: 0.660593,
                            zfar: 100,
                            znear: 0.01
                        },
                        type: 'perspective'
                    }
                ],
                nodes: [
                    {
                        camera: 0
                    }
                ]
            };
            removeCameras(gltf);
            expect(gltf.cameras.length).toEqual(1);
        });
    });

    var removeMeshes = RemoveUnusedProperties.removeMeshes;
    describe('removeMeshes', function () {
        it('removes a mesh', function () {
            var gltf = {
                meshes: [
                    {
                        name: 'unusedMeshId'
                    },
                    {
                        primitives: [{}],
                        name: 'Geometry-mesh002'
                    }
                ],
                nodes: [
                    {
                        mesh: 1,
                        name: 'Geometry-mesh002Node'
                    }
                ]
            };
            removeMeshes(gltf);
            expect(gltf.meshes.length).toEqual(1);
            expect(gltf.meshes[0].name).toEqual('Geometry-mesh002');
            expect(gltf.nodes[0].mesh).toEqual(0);
        });

        it('does not remove any meshes', function () {
            var gltf = {
                meshes: [
                    {
                        primitives: [{}],
                        name: 'Geometry-mesh002'
                    }
                ],
                nodes: [
                    {
                        mesh: 0,
                        name: 'Geometry-mesh002Node'
                    }
                ]
            };
            removeMeshes(gltf);
            expect(gltf.meshes.length).toEqual(1);
            expect(gltf.meshes[0].name).toEqual('Geometry-mesh002');
        });
    });

    var removeAccessors = RemoveUnusedProperties.removeAccessors;
    describe('removeAccessors', function () {
        it('removes an accessor', function () {
            var gltf = {
                accessors: [
                    {
                        bufferView: 3,
                        byteOffset: 128,
                        componentType: 5126,
                        count: 3,
                        type: 'SCALAR'
                    },
                    {
                        bufferView: 0,
                        byteOffset: 0,
                        componentType: 5126,
                        count: 2,
                        type: 'MAT4'
                    },
                    {
                        bufferView: 1,
                        byteOffset: 0,
                        componentType: 5123,
                        count: 564,
                        type: 'SCALAR'
                    },
                    {
                        bufferView: 1,
                        byteOffset: 0,
                        componentType: 5126,
                        count: 160,
                        type: 'VEC3'
                    },
                    {
                        bufferView: 2,
                        byteOffset: 128,
                        componentType: 5126,
                        count: 3,
                        type: 'SCALAR'
                    }
                ],
                animations: [
                    {
                        samplers: [
                            {
                                input: 4
                            }
                        ]
                    }
                ],
                meshes: [
                    {
                        primitives: [
                            {
                                attributes: {
                                    POSITION: 3
                                },
                                indices: 2,
                                material: 0
                            }
                        ]
                    }
                ],
                skins: [
                    {
                        inverseBindMatrices: 1,
                        jointNames: []
                    }
                ]
            };
            removeAccessors(gltf);
            expect(gltf.accessors.length).toEqual(4);
            expect(gltf.skins[0].inverseBindMatrices).toEqual(0);
            expect(gltf.meshes[0].primitives[0].indices).toEqual(1);
            expect(gltf.meshes[0].primitives[0].attributes.POSITION).toEqual(2);
            expect(gltf.animations[0].samplers[0].input).toEqual(3);
        });

        it('does not remove any accessors', function () {
            var gltf = {
                accessors: [
                    {
                        bufferView: 0,
                        byteOffset: 0,
                        componentType: 5126,
                        count: 2,
                        type: 'MAT4'
                    },
                    {
                        bufferView: 1,
                        byteOffset: 0,
                        componentType: 5123,
                        count: 564,
                        type: 'SCALAR'
                    },
                    {
                        bufferView: 1,
                        byteOffset: 0,
                        componentType: 5126,
                        count: 160,
                        type: 'VEC3'
                    },
                    {
                        bufferView: 2,
                        byteOffset: 128,
                        componentType: 5126,
                        count: 3,
                        type: 'SCALAR'
                    }
                ],
                animations: [
                    {
                        samplers: [
                            {
                                input: 3
                            }
                        ]
                    }
                ],
                meshes: [
                    {
                        primitives: [
                            {
                                attributes: {
                                    POSITION: 2
                                },
                                indices: 1,
                                material: 0
                            }
                        ]
                    }
                ],
                skins: [
                    {
                        inverseBindMatrices: 0,
                        jointNames: []
                    }
                ]
            };

            removeAccessors(gltf);
            expect(gltf.accessors.length).toEqual(4);
            expect(gltf.skins[0].inverseBindMatrices).toEqual(0);
            expect(gltf.meshes[0].primitives[0].indices).toEqual(1);
            expect(gltf.meshes[0].primitives[0].attributes.POSITION).toEqual(2);
            expect(gltf.animations[0].samplers[0].input).toEqual(3);
        });
    });

    var removeMaterials = RemoveUnusedProperties.removeMaterials;
    describe('removeMaterials', function () {
        it('removes a material', function () {
            var gltf = {
                materials: [
                    {
                        name: 'unused'
                    },
                    {
                        name: 'Texture',
                        technique: 0,
                        values: {
                            diffuse: [0],
                            shininess: [256]
                        }
                    }
                ],
                meshes: [
                    {
                        primitives: [
                            {
                                material: 1
                            }
                        ]
                    }
                ]
            };
            removeMaterials(gltf);
            expect(gltf.materials.length).toEqual(1);
            expect(gltf.materials[0].name).not.toEqual('unused');
            expect(gltf.meshes[0].primitives[0].material).toEqual(0);
        });

        it('does not remove any materials', function () {
            var gltf = {
                materials: [
                    {
                        name: 'Texture',
                        technique: 0,
                        values: {
                            diffuse: [0],
                            shininess: [256]
                        }
                    }
                ],
                meshes: [
                    {
                        primitives: [
                            {
                                material: 0
                            }
                        ]
                    }
                ]
            };
            removeMaterials(gltf);
            expect(gltf.materials.length).toEqual(1);
        });
    });

    var removeBufferViews = RemoveUnusedProperties.removeBufferViews;
    describe('removeBufferViews', function () {
        it('removes a bufferView', function () {
            var gltf = {
                accessors: [
                    {
                        bufferView: 1,
                        byteOffset: 0,
                        byteStride: 0,
                        componentType: 5123,
                        count: 36,
                        type: 'SCALAR'
                    }
                ],
                bufferViews: [
                    {
                        buffer: 0,
                        byteLength: 768,
                        byteOffset: 72,
                        target: 34962
                    },
                    {
                        buffer: 0,
                        byteLength: 72,
                        byteOffset: 0,
                        target: 34963
                    }
                ]
            };
            removeBufferViews(gltf);
            expect(gltf.bufferViews.length).toEqual(1);
            expect(gltf.accessors[0].bufferView).toEqual(0);
        });

        it('does not remove any buffer views', function () {
            var gltf = {
                accessors: [
                    {
                        bufferView: 0,
                        byteOffset: 0,
                        byteStride: 0,
                        componentType: 5123,
                        count: 36,
                        type: 'SCALAR'
                    }
                ],
                bufferViews: [
                    {
                        buffer: 0,
                        byteLength: 72,
                        byteOffset: 0,
                        target: 34963
                    }
                ]
            };
            removeBufferViews(gltf);
            expect(gltf.bufferViews.length).toEqual(1);
        });
    });

    var removeTechniques = RemoveUnusedProperties.removeTechniques;
    describe('removeTechniques', function () {
        it('removes a technique', function () {
            var gltf = {
                materials: [
                    {
                        technique: 1
                    }
                ],
                techniques: [
                    {
                        name: 'unused'
                    },
                    {
                        name: 'used'
                    }
                ]
            };
            removeTechniques(gltf);
            expect(gltf.techniques.length).toEqual(1);
            expect(gltf.techniques[0].name).not.toEqual('unused');
            expect(gltf.materials[0].technique).toEqual(0);
        });

        it('does not remove any techniques', function () {
            var gltf = {
                materials: [
                    {
                        technique: 0
                    }
                ],
                techniques: [
                    {}
                ]
            };
            removeTechniques(gltf);
            expect(gltf.techniques.length).toEqual(1);
        });
    });

    var removeTextures = RemoveUnusedProperties.removeTextures;
    describe('removeTextures', function () {
        it('removes a texture unused by material', function () {
            var gltf = {
                materials: [
                    {
                        values: {
                            diffuse: [1]
                        }
                    }
                ],
                textures: [
                    {
                        name: 'unused'
                    },
                    {
                        source: 0
                    }
                ]
            };

            removeTextures(gltf);
            expect(gltf.textures.length).toEqual(1);
            expect(gltf.textures[0].name).not.toEqual('unused');
            expect(gltf.materials[0].values.diffuse[0]).toEqual(0);
        });

        it('removes a texture unused by technique', function () {
            var gltf = {
                techniques: [
                    {
                        parameters: {
                            diffuse: {
                                value: [1]
                            }
                        }
                    }
                ],
                textures: [
                    {
                        name: 'unused'
                    },
                    {
                        source: 0
                    }
                ]
            };

            removeTextures(gltf);
            expect(gltf.textures.length).toEqual(1);
            expect(gltf.textures[0].name).not.toEqual('unused');
            expect(gltf.techniques[0].parameters.diffuse.value[0]).toEqual(0);
        });

        it('does not remove any textures', function () {
            var gltf = {
                materials: [
                    {
                        values: {
                            diffuse: [0]
                        }
                    }
                ],
                techniques: [
                    {
                        parameters: {
                            diffuse: {
                                value: [1]
                            }
                        }
                    }
                ],
                textures: [
                    {},
                    {}
                ]
            };
            removeTextures(gltf);
            expect(gltf.textures.length).toEqual(2);
        });
    });

    var removeBuffers = RemoveUnusedProperties.removeBuffers;
    describe('removeBuffers', function () {
        it('removes a buffer', function () {
            var gltf = {
                bufferViews: [
                    {
                        buffer: 1
                    }
                ],
                buffers: [
                    {
                        name: 'unused'
                    },
                    {}
                ]
            };
            removeBuffers(gltf);
            expect(gltf.buffers.length).toEqual(1);
            expect(gltf.bufferViews[0].buffer).toEqual(0);
            expect(gltf.buffers[0].name).not.toEqual('unused');
        });

        it('does not remove any buffers', function () {
            var gltf = {
                bufferViews: [
                    {
                        buffer: 0
                    }
                ],
                buffers: [
                    {}
                ]
            };
            removeBuffers(gltf);
            expect(gltf.buffers.length).toEqual(1);
        });
    });

    var removePrograms = RemoveUnusedProperties.removePrograms;
    describe('removePrograms', function () {
        it('removes a program', function () {
            var gltf = {
                programs: [
                    {
                        name: 'unused'
                    },
                    {}
                ],
                techniques: [
                    {
                        program: 1
                    }
                ]
            };

            removePrograms(gltf);
            expect(gltf.programs.length).toEqual(1);
            expect(gltf.programs[0].name).not.toEqual('unused');
            expect(gltf.techniques[0].program).toEqual(0);
        });

        it('does not remove any programs', function () {
            var gltf = {
                programs: [
                    {}
                ],
                techniques: [
                    {
                        program: 0
                    }
                ]
            };

            removePrograms(gltf);
            expect(gltf.programs.length).toEqual(1);
        });
    });

    var removeImages = RemoveUnusedProperties.removeImages;
    describe('removeImages', function() {
        it('removes an image', function() {
            var gltf = {
                images: [
                    {
                        name: 'unused'
                    },
                    {}
                ],
                textures: [
                    {
                        source: 1
                    }
                ]
            };

            removeImages(gltf);
            expect(gltf.images.length).toEqual(1);
            expect(gltf.images[0].name).not.toEqual('unused');
            expect(gltf.textures[0].source).toEqual(0);
        });

        it('does not remove any images', function() {
            var gltf = {
                images: [
                    {}
                ],
                textures: [
                    {
                        source: 0
                    }
                ]
            };

            removeImages(gltf);
            expect(gltf.images.length).toEqual(1);
        });
    });

    var removeSamplers = RemoveUnusedProperties.removeSamplers;
    describe('removeSamplers', function() {
        it('removes a sampler', function() {
            var gltf = {
                samplers: [
                    {
                        name: 'unused'
                    },
                    {
                        magFilter: 9729,
                        minFilter: 9987,
                        wrapS: 10497,
                        wrapT: 10497
                    }
                ],
                textures: [
                    {
                        format: 6408,
                        internalFormat: 6408,
                        sampler: 1,
                        source: 0,
                        target: 3553,
                        type: 5121
                    }
                ]
            };
            removeSamplers(gltf);
            expect(gltf.samplers.length).toEqual(1);
            expect(gltf.samplers[0].name).not.toEqual('unused');
            expect(gltf.textures[0].sampler).toEqual(0);
        });

        it('does not remove any samplers', function() {
            var gltf = {
                samplers: [
                    {
                        magFilter: 9729,
                        minFilter: 9987,
                        wrapS: 10497,
                        wrapT: 10497
                    }
                ],
                textures: [
                    {
                        format: 6408,
                        internalFormat: 6408,
                        sampler: 0,
                        source: 0,
                        target: 3553,
                        type: 5121
                    }
                ]
            };
            removeSamplers(gltf);
            expect(gltf.samplers.length).toEqual(1);
        });
    });

    var removeShaders = RemoveUnusedProperties.removeShaders;
    describe('removeShaders', function() {
        it('removes a shader', function() {
            var gltf = {
                programs: [
                    {
                        attributes: [
                            'a_normal',
                            'a_position',
                            'a_texcoord0'
                        ],
                        fragmentShader: 1,
                        vertexShader: 2
                    }
                ],
                shaders: [
                    {
                        type: 35633,
                        uri: 'CesiumTexturedBoxTest0VS.glsl'
                    },
                    {
                        type: 35632,
                        uri: 'CesiumTexturedBoxTest0FS.glsl'
                    },
                    {
                        type: 35633,
                        uri: 'CesiumTexturedBoxTest0VS.glsl'
                    }
                ]
            };
            removeShaders(gltf);
            expect(gltf.shaders.length).toEqual(2);
            expect(gltf.programs[0].fragmentShader).toEqual(0);
            expect(gltf.programs[0].vertexShader).toEqual(1);
        });

        it('does not remove any shaders', function() {
            var gltf = {
                programs: [
                    {
                        attributes: [
                            'a_normal',
                            'a_position',
                            'a_texcoord0'
                        ],
                        fragmentShader: 0,
                        vertexShader: 1
                    }
                ],
                shaders: [
                    {
                        type: 35632,
                        uri: 'CesiumTexturedBoxTest0FS.glsl'
                    },
                    {
                        type: 35633,
                        uri: 'CesiumTexturedBoxTest0VS.glsl'
                    }
                ]
            };
            removeShaders(gltf);
            expect(gltf.shaders.length).toEqual(2);
        });
    });

    var removePrimitiveAttributes = RemoveUnusedProperties.removePrimitiveAttributes;
    describe('removePrimitiveAttributes', function() {
        it('removes unused primitive attributes', function() {
            var gltf = {
                meshes : [
                    {
                        primitives: [
                            {
                                attributes : {
                                    KEEP_ATTRIBUTE_1 : 0,
                                    KEEP_ATTRIBUTE_2 : 1,
                                    DROP_ATTRIBUTE_3 : 2,
                                    KEEP_ATTRIBUTE_4 : 3,
                                    DROP_ATTRIBUTE_5 : 4
                                },
                                material : 0
                            }
                        ]
                    }
                ],
                materials : [
                    {
                        technique : 0
                    }
                ],
                techniques : [
                    {
                        parameters : {
                            attribute1: {
                                semantic : 'KEEP_ATTRIBUTE_1'
                            },
                            attribute2: {
                                semantic : 'KEEP_ATTRIBUTE_2'
                            },
                            attribute3: {},
                            attribute4 : {
                                semantic : 'KEEP_ATTRIBUTE_4'
                            }
                        }
                    }
                ]
            };
            removePrimitiveAttributes(gltf);
            var attributes = gltf.meshes[0].primitives[0].attributes;
            expect(attributes.KEEP_ATTRIBUTE_1).toBeDefined();
            expect(attributes.KEEP_ATTRIBUTE_2).toBeDefined();
            expect(attributes.DROP_ATTRIBUTE_3).not.toBeDefined();
            expect(attributes.KEEP_ATTRIBUTE_4).toBeDefined();
            expect(attributes.DROP_ATTRIBUTE_5).not.toBeDefined();
        });
    });

    var removeAll = RemoveUnusedProperties.removeAll;
    describe('removeAll', function() {
        it('removes a tree of objects', function (done) {
            expect(fsReadFile(gltfPath)
                .then(function (data) {
                    var gltf = JSON.parse(data);
                    removeAll(gltf);

                    expect(gltf.accessors.accessor_23).not.toBeDefined();
                    expect(gltf.accessors.animAccessor_0).not.toBeDefined();
                    expect(gltf.accessors['IBM_Armature_Cylinder-skin']).not.toBeDefined();
                    expect(gltf.bufferViews.bufferView_30).not.toBeDefined();
                    expect(gltf.buffers.CesiumTexturedBoxTest).not.toBeDefined();
                    expect(gltf.cameras.camera_0).not.toBeDefined();
                    expect(gltf.images.Image0001).not.toBeDefined();
                    expect(gltf.materials['Effect-Texture']).not.toBeDefined();
                    expect(gltf.meshes['Geometry-mesh002']).not.toBeDefined();
                    expect(gltf.nodes['Geometry-mesh002Node']).not.toBeDefined();
                    expect(gltf.nodes.groupLocator030Node).not.toBeDefined();
                    expect(gltf.nodes.node_3).not.toBeDefined();
                    expect(gltf.nodes.txtrLocator026Node).not.toBeDefined();
                    expect(gltf.programs.program_0).not.toBeDefined();
                    expect(gltf.samplers.sampler_0).not.toBeDefined();
                    expect(gltf.shaders.CesiumTexturedBoxTest0FS).not.toBeDefined();
                    expect(gltf.shaders.CesiumTexturedBoxTest0VS).not.toBeDefined();
                    expect(gltf.skins['Armature_Cylinder-skin']).not.toBeDefined();
                    expect(gltf.techniques.technique0).not.toBeDefined();
                    expect(gltf.textures.texture_Image0001).not.toBeDefined();

                    expect(Object.keys(gltf.nodes).length).toEqual(0);
                    expect(Object.keys(gltf.skins).length).toEqual(0);
                    expect(Object.keys(gltf.cameras).length).toEqual(0);
                    expect(Object.keys(gltf.meshes).length).toEqual(0);
                    expect(Object.keys(gltf.accessors).length).toEqual(0);
                    expect(Object.keys(gltf.materials).length).toEqual(0);
                    expect(Object.keys(gltf.bufferViews).length).toEqual(0);
                    expect(Object.keys(gltf.techniques).length).toEqual(0);
                    expect(Object.keys(gltf.textures).length).toEqual(0);
                    expect(Object.keys(gltf.buffers).length).toEqual(0);
                    expect(Object.keys(gltf.programs).length).toEqual(0);
                    expect(Object.keys(gltf.images).length).toEqual(0);
                    expect(Object.keys(gltf.samplers).length).toEqual(0);
                    expect(Object.keys(gltf.shaders).length).toEqual(0);
                }), done).toResolve();
        });

        it('does not remove any objects', function (done) {
            expect(fsReadFile(gltfPath)
                .then(function (data) {
                    var gltf = JSON.parse(data);
                    gltf.scenes.defaultScene.nodes[0] = 'node_3';
                    gltf.animations.animation_0.samplers = {
                        sampler : {
                            input : 'animAccessor_0'
                        }
                    };
                    removeAll(gltf);

                    expect(gltf.accessors.accessor_23).toBeDefined();
                    expect(gltf.accessors.animAccessor_0).toBeDefined();
                    expect(gltf.accessors['IBM_Armature_Cylinder-skin']).toBeDefined();
                    expect(gltf.bufferViews.bufferView_30).toBeDefined();
                    expect(gltf.buffers.CesiumTexturedBoxTest).toBeDefined();
                    expect(gltf.cameras.camera_0).toBeDefined();
                    expect(gltf.images.Image0001).toBeDefined();
                    expect(gltf.materials['Effect-Texture']).toBeDefined();
                    expect(gltf.meshes['Geometry-mesh002']).toBeDefined();
                    expect(gltf.nodes['Geometry-mesh002Node']).toBeDefined();
                    expect(gltf.nodes.groupLocator030Node).toBeDefined();
                    expect(gltf.nodes.node_3).toBeDefined();
                    expect(gltf.nodes.txtrLocator026Node).toBeDefined();
                    expect(gltf.programs.program_0).toBeDefined();
                    expect(gltf.samplers.sampler_0).toBeDefined();
                    expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
                    expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();
                    expect(gltf.skins['Armature_Cylinder-skin']).toBeDefined();
                    expect(gltf.techniques.technique0).toBeDefined();
                    expect(gltf.textures.texture_Image0001).toBeDefined();

                    expect(Object.keys(gltf.nodes).length).toEqual(4);
                    expect(Object.keys(gltf.skins).length).toEqual(1);
                    expect(Object.keys(gltf.cameras).length).toEqual(1);
                    expect(Object.keys(gltf.meshes).length).toEqual(1);
                    expect(Object.keys(gltf.accessors).length).toEqual(3);
                    expect(Object.keys(gltf.materials).length).toEqual(1);
                    expect(Object.keys(gltf.bufferViews).length).toEqual(1);
                    expect(Object.keys(gltf.techniques).length).toEqual(1);
                    expect(Object.keys(gltf.textures).length).toEqual(1);
                    expect(Object.keys(gltf.buffers).length).toEqual(1);
                    expect(Object.keys(gltf.programs).length).toEqual(1);
                    expect(Object.keys(gltf.images).length).toEqual(1);
                    expect(Object.keys(gltf.samplers).length).toEqual(1);
                    expect(Object.keys(gltf.shaders).length).toEqual(2);
                }), done).toResolve();
        });
    });
});