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
                "nodes": {
                    "node_3": {
                        "children": [
                            "left_node",
                            "right_node"
                        ]
                    },
                    "left_node": {},
                    "right_node": {
                        "children": [
                            "txtrLocator026Node"
                        ]
                    },
                    "txtrLocator026Node": {},
                    "unusedNodeId": {}
                },
                "scenes": {
                    "defaultScene": {
                        "nodes": [
                            "node_3"
                        ]
                    }
                }
            };
            removeNodes(gltf);
            expect(gltf.nodes.unusedNodeId).not.toBeDefined();
            expect(Object.keys(gltf.nodes).length).toEqual(4);
        });

        it('removes an unused tree', function () {
            var gltf = {
                "nodes": {
                    "node_3": {
                        "children": [
                            "left_node",
                            "right_node"
                        ]
                    },
                    "left_node": {},
                    "right_node": {
                        "children": [
                            "txtrLocator026Node"
                        ]
                    },
                    "txtrLocator026Node": {}
                },
                "scenes": {
                    "defaultScene": {}
                }
            };
            removeNodes(gltf);
            expect(gltf.nodes.node_3).not.toBeDefined();
            expect(gltf.nodes.left_node).not.toBeDefined();
            expect(gltf.nodes.right_node).not.toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).not.toBeDefined();
            expect(Object.keys(gltf.nodes).length).toEqual(0);
        });

        it('removes an extra tree', function () {
            var gltf = {
                "nodes": {
                    "node_3": {
                        "children": [
                            "left_node",
                            "right_node"
                        ]
                    },
                    "left_node": {},
                    "right_node": {
                        "children": [
                            "txtrLocator026Node"
                        ]
                    },
                    "txtrLocator026Node": {},
                    "unusedRootId": {
                        "children": [
                            "unusedLeftId",
                            "unusedRightId"
                        ]
                    },
                    "unusedLeftId": {},
                    "unusedRightId": {
                        "children": [
                            "unusedChildId"
                        ]
                    },
                    "unusedChildId": {}
                },
                "scenes": {
                    "defaultScene": {
                        "nodes": [
                            "node_3"
                        ]
                    }
                }
            };
            removeNodes(gltf);
            expect(gltf.nodes.unusedRootId).not.toBeDefined();
            expect(gltf.nodes.unusedLeftId).not.toBeDefined();
            expect(gltf.nodes.unusedRightId).not.toBeDefined();
            expect(gltf.nodes.unusedChildId).not.toBeDefined();
            expect(Object.keys(gltf.nodes).length).toEqual(4);
        });

        it('does not remove any nodes', function () {
            var gltf = {
                "nodes": {
                    "node_3": {
                        "children": [
                            "left_node",
                            "right_node"
                        ]
                    },
                    "left_node": {},
                    "right_node": {
                        "children": [
                            "txtrLocator026Node"
                        ]
                    },
                    "txtrLocator026Node": {}
                },
                "scenes": {
                    "defaultScene": {
                        "nodes": [
                            "node_3"
                        ]
                    }
                }
            };

            removeNodes(gltf);
            expect(gltf.nodes.node_3).toBeDefined();
            expect(gltf.nodes.left_node).toBeDefined();
            expect(gltf.nodes.right_node).toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).toBeDefined();
            expect(Object.keys(gltf.nodes).length).toEqual(4);
        });
    });

    var removeSkins = RemoveUnusedProperties.removeSkins;
    describe('removeSkins', function () {
        it('removes a skin', function () {
            var gltf = {
                "nodes": {
                    "Cylinder": {
                        "skin": "Armature_Cylinder-skin"
                    }
                },
                "skins": {
                    "Armature_Cylinder-skin": {
                        "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                        "jointNames": [
                            "Bone"
                        ]
                    },
                    "unusedSkinId": {
                        "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                        "jointNames": [
                            "Bone"
                        ]
                    }
                }
            };
            removeSkins(gltf);
            expect(gltf.skins.unusedSkinId).not.toBeDefined();
            expect(Object.keys(gltf.skins).length).toEqual(1);
        });

        it('does not remove any skins', function () {
            var gltf = {
                "nodes": {
                    "Cylinder": {
                        "skin": "Armature_Cylinder-skin"
                    }
                },
                "skins": {
                    "Armature_Cylinder-skin": {
                        "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                        "jointNames": [
                            "Bone"
                        ]
                    }
                }
            };
            removeSkins(gltf);
            expect(gltf.skins["Armature_Cylinder-skin"]).toBeDefined();
            expect(Object.keys(gltf.skins).length).toEqual(1);
        });
    });

    var removeCameras = RemoveUnusedProperties.removeCameras;
    describe('removeCameras', function () {
        it('removes a camera', function () {
            var gltf = {
                "cameras": {
                    "camera_0": {
                        "perspective": {
                            "aspectRatio": 1.5,
                            "yfov": 0.660593,
                            "zfar": 100,
                            "znear": 0.01
                        },
                        "type": "perspective"
                    },
                    "unusedCameraId": {
                        "perspective": {
                            "aspectRatio": 1.5,
                            "yfov": 0.660593,
                            "zfar": 100,
                            "znear": 0.01
                        },
                        "type": "perspective"
                    }
                },
                "nodes": {
                    "node_3": {
                        "camera": "camera_0"
                    }
                }
            };
            removeCameras(gltf);
            expect(gltf.cameras.unusedCameraId).not.toBeDefined();
            expect(Object.keys(gltf.cameras).length).toEqual(1);
        });

        it('does not remove any cameras', function () {
            var gltf = {
                "cameras": {
                    "camera_0": {
                        "perspective": {
                            "aspectRatio": 1.5,
                            "yfov": 0.660593,
                            "zfar": 100,
                            "znear": 0.01
                        },
                        "type": "perspective"
                    }
                },
                "nodes": {
                    "node_3": {
                        "camera": "camera_0"
                    }
                }
            };
            removeCameras(gltf);
            expect(gltf.cameras.camera_0).toBeDefined();
            expect(Object.keys(gltf.cameras).length).toEqual(1);
        });
    });

    var removeMeshes = RemoveUnusedProperties.removeMeshes;
    describe('removeMeshes', function () {
        it('removes a mesh', function () {
            var gltf = {
                "meshes": {
                    "Geometry-mesh002": {},
                    "unusedMeshId": {}
                },
                "nodes": {
                    "Geometry-mesh002Node": {
                        "meshes": [
                            "Geometry-mesh002"
                        ]
                    }
                }
            };
            removeMeshes(gltf);
            expect(gltf.meshes.unusedMeshId).not.toBeDefined();
            expect(Object.keys(gltf.meshes).length).toEqual(1);
        });

        it('does not remove any meshes', function () {
            var gltf = {
                "meshes": {
                    "Geometry-mesh002": {}
                },
                "nodes": {
                    "Geometry-mesh002Node": {
                        "meshes": [
                            "Geometry-mesh002"
                        ]
                    }
                }
            };
            removeMeshes(gltf);
            expect(gltf.meshes["Geometry-mesh002"]).toBeDefined();
            expect(Object.keys(gltf.meshes).length).toEqual(1);
        });
    });

    var removeAccessors = RemoveUnusedProperties.removeAccessors;
    describe('removeAccessors', function () {
        it('removes an accessor', function () {
            var gltf = {
                "accessors": {
                    "IBM_Armature_Cylinder-skin": {
                        "bufferView": "bufferView_43",
                        "byteOffset": 0,
                        "componentType": 5126,
                        "count": 2,
                        "type": "MAT4"
                    },
                    "accessor_16": {
                        "bufferView": "bufferView_44",
                        "byteOffset": 0,
                        "componentType": 5123,
                        "count": 564,
                        "type": "SCALAR"
                    },
                    "accessor_18": {
                        "bufferView": "bufferView_45",
                        "byteOffset": 0,
                        "componentType": 5126,
                        "count": 160,
                        "type": "VEC3"
                    },
                    "animAccessor_0": {
                        "bufferView": "bufferView_43",
                        "byteOffset": 128,
                        "componentType": 5126,
                        "count": 3,
                        "type": "SCALAR"
                    },
                    "unusedAccessorId": {
                        "bufferView": "bufferView_43",
                        "byteOffset": 128,
                        "componentType": 5126,
                        "count": 3,
                        "type": "SCALAR"
                    }
                },
                "animations": {
                    "animation_0": {
                        "parameters": {
                            "TIME": "animAccessor_0"
                        }
                    }
                },
                "meshes": {
                    "Cylinder-mesh": {
                        "primitives": [
                            {
                                "attributes": {
                                    "POSITION": "accessor_18"
                                },
                                "indices": "accessor_16",
                                "material": "Material_001-effect"
                            }
                        ]
                    }
                },
                "skins": {
                    "Armature_Cylinder-skin": {
                        "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                        "jointNames": []
                    }
                }
            };
            removeAccessors(gltf);
            expect(gltf.accessors.unusedAccessorId).not.toBeDefined();
            expect(Object.keys(gltf.accessors).length).toEqual(4);
        });

        it('does not remove any accessors', function () {
            var gltf = {
                "accessors": {
                    "IBM_Armature_Cylinder-skin": {
                        "bufferView": "bufferView_43",
                        "byteOffset": 0,
                        "componentType": 5126,
                        "count": 2,
                        "type": "MAT4"
                    },
                    "accessor_16": {
                        "bufferView": "bufferView_44",
                        "byteOffset": 0,
                        "componentType": 5123,
                        "count": 564,
                        "type": "SCALAR"
                    },
                    "accessor_18": {
                        "bufferView": "bufferView_45",
                        "byteOffset": 0,
                        "componentType": 5126,
                        "count": 160,
                        "type": "VEC3"
                    },
                    "animAccessor_0": {
                        "bufferView": "bufferView_43",
                        "byteOffset": 128,
                        "componentType": 5126,
                        "count": 3,
                        "type": "SCALAR"
                    }
                },
                "animations": {
                    "animation_0": {
                        "parameters": {
                            "TIME": "animAccessor_0"
                        }
                    }
                },
                "meshes": {
                    "Cylinder-mesh": {
                        "primitives": [
                            {
                                "attributes": {
                                    "POSITION": "accessor_18"
                                },
                                "indices": "accessor_16",
                                "material": "Material_001-effect"
                            }
                        ]
                    }
                },
                "skins": {
                    "Armature_Cylinder-skin": {
                        "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                        "jointNames": []
                    }
                }
            };

            removeAccessors(gltf);
            expect(gltf.accessors["IBM_Armature_Cylinder-skin"]).toBeDefined();
            expect(gltf.accessors.accessor_16).toBeDefined();
            expect(gltf.accessors.accessor_18).toBeDefined();
            expect(gltf.accessors.animAccessor_0).toBeDefined();
            expect(Object.keys(gltf.accessors).length).toEqual(4);
        });
    });

    var removeMaterials = RemoveUnusedProperties.removeMaterials;
    describe('removeMaterials', function () {
        it('removes a material', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
                            "diffuse": "texture_Image0001",
                            "shininess": 256
                        }
                    },
                    "unusedMaterialId": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
                            "diffuse": "texture_Image0001",
                            "shininess": 256
                        }
                    }
                },
                "meshes": {
                    "Geometry-mesh002": {
                        "primitives": [
                            {
                                "material": "Effect-Texture"
                            }
                        ]
                    }
                }
            };
            removeMaterials(gltf);
            expect(gltf.materials.unusedMaterialId).not.toBeDefined();
            expect(Object.keys(gltf.materials).length).toEqual(1);
        });

        it('does not remove any materials', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
                            "diffuse": "texture_Image0001",
                            "shininess": 256
                        }
                    }
                },
                "meshes": {
                    "Geometry-mesh002": {
                        "primitives": [
                            {
                                "material": "Effect-Texture"
                            }
                        ]
                    }
                }
            };
            removeMaterials(gltf);
            expect(gltf.materials["Effect-Texture"]).toBeDefined();
            expect(Object.keys(gltf.materials).length).toEqual(1);
        });
    });

    var removeBufferViews = RemoveUnusedProperties.removeBufferViews;
    describe('removeBufferViews', function () {
        it('removes a bufferView', function () {
            var gltf = {
                "accessors": {
                    "accessor_21": {
                        "bufferView": "bufferView_29",
                        "byteOffset": 0,
                        "byteStride": 0,
                        "componentType": 5123,
                        "count": 36,
                        "type": "SCALAR"
                    }
                },
                "bufferViews": {
                    "bufferView_29": {
                        "buffer": "CesiumTexturedBoxTest",
                        "byteLength": 72,
                        "byteOffset": 0,
                        "target": 34963
                    },
                    "unusedBufferViewId": {
                        "buffer": "CesiumTexturedBoxTest",
                        "byteLength": 768,
                        "byteOffset": 72,
                        "target": 34962
                    }
                }
            };
            removeBufferViews(gltf);
            expect(gltf.bufferViews.unusedBufferViewId).not.toBeDefined();
            expect(Object.keys(gltf.bufferViews).length).toEqual(1);
        });

        it('does not remove any buffers', function () {
            var gltf = {
                "accessors": {
                    "accessor_21": {
                        "bufferView": "bufferView_29",
                        "byteOffset": 0,
                        "byteStride": 0,
                        "componentType": 5123,
                        "count": 36,
                        "type": "SCALAR"
                    }
                },
                "bufferViews": {
                    "bufferView_29": {
                        "buffer": "CesiumTexturedBoxTest",
                        "byteLength": 72,
                        "byteOffset": 0,
                        "target": 34963
                    }
                }
            };
            removeBufferViews(gltf);
            expect(gltf.bufferViews.bufferView_29).toBeDefined();
            expect(Object.keys(gltf.bufferViews).length).toEqual(1);
        });
    });

    var removeTechniques = RemoveUnusedProperties.removeTechniques;
    describe('removeTechniques', function () {
        it('removes a technique', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
                            "diffuse": "texture_Image0001"
                        }
                    }
                },
                "techniques": {
                    "technique0": {
                        "attributes": {
                            "a_position": "position"
                        },
                        "parameters": {
                            "modelViewMatrix": {
                                "semantic": "MODELVIEW",
                                "type": 35676
                            },
                            "projectionMatrix": {
                                "semantic": "PROJECTION",
                                "type": 35676
                            }
                        },
                        "program": "program_0",
                        "states": {
                            "enable": [
                                2929,
                                2884
                            ]
                        },
                        "uniforms": {
                            "u_modelViewMatrix": "modelViewMatrix",
                            "u_projectionMatrix": "projectionMatrix"
                        }
                    },
                    "unusedTechniqueId": {
                        "attributes": {
                            "a_position": "position"
                        },
                        "parameters": {
                            "modelViewMatrix": {
                                "semantic": "MODELVIEW",
                                "type": 35676
                            },
                            "projectionMatrix": {
                                "semantic": "PROJECTION",
                                "type": 35676
                            }
                        },
                        "program": "program_0",
                        "states": {
                            "enable": [
                                2929,
                                2884
                            ]
                        },
                        "uniforms": {
                            "u_modelViewMatrix": "modelViewMatrix",
                            "u_projectionMatrix": "projectionMatrix"
                        }
                    }
                }
            };
            removeTechniques(gltf);
            expect(gltf.techniques.unusedTechniqueId).not.toBeDefined();
            expect(Object.keys(gltf.techniques).length).toEqual(1);
        });

        it('does not remove any techniques', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
                            "diffuse": "texture_Image0001"
                        }
                    }
                },
                "techniques": {
                    "technique0": {
                        "attributes": {
                            "a_position": "position"
                        },
                        "parameters": {
                            "modelViewMatrix": {
                                "semantic": "MODELVIEW",
                                "type": 35676
                            },
                            "projectionMatrix": {
                                "semantic": "PROJECTION",
                                "type": 35676
                            }
                        },
                        "program": "program_0",
                        "states": {
                            "enable": [
                                2929,
                                2884
                            ]
                        },
                        "uniforms": {
                            "u_modelViewMatrix": "modelViewMatrix",
                            "u_projectionMatrix": "projectionMatrix"
                        }
                    }
                }
            };
            removeTechniques(gltf);
            expect(gltf.techniques.technique0).toBeDefined();
            expect(Object.keys(gltf.techniques).length).toEqual(1);
        });
    });

    var removeTextures = RemoveUnusedProperties.removeTextures;
    describe('removeTextures', function () {
        it('removes a texture', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
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
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    },
                    "unusedTextureId": {
                        "sampler": "sampler_0",
                        "source": "Image0001"
                    }
                }
            };
            removeTextures(gltf);
            expect(gltf.textures.unusedTextureId).not.toBeDefined();
            expect(Object.keys(gltf.textures).length).toEqual(1);
        });

        it('removes a texture', function () {
            var gltf = {
                "techniques": {
                    "technique0": {
                        "parameters": {
                            "diffuse": {
                                "type": 35678,
                                "value": "texture_Image0001"
                            }
                        },
                        "program": "program_0"
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    },
                    "unusedTextureId": {
                        "sampler": "sampler_0",
                        "source": "Image0001"
                    }
                }
            };
            removeTextures(gltf);
            expect(gltf.textures.unusedTextureId).not.toBeDefined();
            expect(Object.keys(gltf.textures).length).toEqual(1);
        });

        it('does not remove any textures', function () {
            var gltf = {
                "materials": {
                    "Effect-Texture": {
                        "name": "Texture",
                        "technique": "technique0",
                        "values": {
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
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeTextures(gltf);
            expect(gltf.textures.texture_Image0001).toBeDefined();
            expect(Object.keys(gltf.textures).length).toEqual(1);
        });

        it('does not remove any textures', function () {
            var gltf = {
                "techniques": {
                    "technique0": {
                        "parameters": {
                            "diffuse": {
                                "type": 35678,
                                "value": "texture_Image0001"
                            }
                        },
                        "program": "program_0"
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeTextures(gltf);
            expect(gltf.textures.texture_Image0001).toBeDefined();
            expect(Object.keys(gltf.textures).length).toEqual(1);
        });
    });

    var removeBuffers = RemoveUnusedProperties.removeBuffers;
    describe('removeBuffers', function () {
        it('removes a buffer', function () {
            var gltf = {
                "bufferViews": {
                    "bufferView_29": {
                        "buffer": "CesiumTexturedBoxTest",
                        "byteLength": 72,
                        "byteOffset": 0,
                        "target": 34963
                    }
                },
                "buffers": {
                    "CesiumTexturedBoxTest": {
                        "byteLength": 840,
                        "type": "arraybuffer",
                        "uri": "CesiumTexturedBoxTest.bin"
                    },
                    "unusedBufferId": {
                        "byteLength": 840,
                        "type": "arraybuffer",
                        "uri": "CesiumTexturedBoxTest.bin"
                    }
                }
            };
            removeBuffers(gltf);
            expect(gltf.buffers.unusedBufferId).not.toBeDefined();
            expect(Object.keys(gltf.buffers).length).toEqual(1);
        });

        it('does not remove any buffers', function () {
            var gltf = {
                "bufferViews": {
                    "bufferView_29": {
                        "buffer": "CesiumTexturedBoxTest",
                        "byteLength": 72,
                        "byteOffset": 0,
                        "target": 34963
                    }
                },
                "buffers": {
                    "CesiumTexturedBoxTest": {
                        "byteLength": 840,
                        "type": "arraybuffer",
                        "uri": "CesiumTexturedBoxTest.bin"
                    }
                }
            };
            removeBuffers(gltf);
            expect(gltf.buffers.CesiumTexturedBoxTest).toBeDefined();
            expect(Object.keys(gltf.buffers).length).toEqual(1);
        });
    });

    var removePrograms = RemoveUnusedProperties.removePrograms;
    describe('removePrograms', function () {
        it('removes a program', function () {
            var gltf = {
                "programs": {
                    "program_0": {
                        "attributes": [
                            "a_position"
                        ],
                        "fragmentShader": "CesiumTexturedBoxTest0FS",
                        "vertexShader": "CesiumTexturedBoxTest0VS"
                    },
                    "unusedProgramId": {
                        "attributes": [
                            "a_position"
                        ],
                        "fragmentShader": "CesiumTexturedBoxTest0FS",
                        "vertexShader": "CesiumTexturedBoxTest0VS"
                    }
                },
                "techniques": {
                    "technique0": {
                        "attributes": {
                            "a_position": "position"
                        },
                        "parameters": {
                            "modelViewMatrix": {
                                "semantic": "MODELVIEW",
                                "type": 35676
                            },
                            "projectionMatrix": {
                                "semantic": "PROJECTION",
                                "type": 35676
                            }
                        },
                        "program": "program_0",
                        "states": {
                            "enable": [
                                2929,
                                2884
                            ]
                        },
                        "uniforms": {
                            "u_modelViewMatrix": "modelViewMatrix",
                            "u_projectionMatrix": "projectionMatrix"
                        }
                    }
                }
            };
            removePrograms(gltf);
            expect(gltf.programs.unusedProgramId).not.toBeDefined();
            expect(Object.keys(gltf.programs).length).toEqual(1);
        });

        it('does not remove any programs', function () {
            var gltf = {
                "programs": {
                    "program_0": {
                        "attributes": [
                            "a_position"
                        ],
                        "fragmentShader": "CesiumTexturedBoxTest0FS",
                        "vertexShader": "CesiumTexturedBoxTest0VS"
                    }
                },
                "techniques": {
                    "technique0": {
                        "attributes": {
                            "a_position": "position"
                        },
                        "parameters": {
                            "modelViewMatrix": {
                                "semantic": "MODELVIEW",
                                "type": 35676
                            },
                            "projectionMatrix": {
                                "semantic": "PROJECTION",
                                "type": 35676
                            }
                        },
                        "program": "program_0",
                        "states": {
                            "enable": [
                                2929,
                                2884
                            ]
                        },
                        "uniforms": {
                            "u_modelViewMatrix": "modelViewMatrix",
                            "u_projectionMatrix": "projectionMatrix"
                        }
                    }
                }
            };
            removePrograms(gltf);
            expect(gltf.programs.program_0).toBeDefined();
            expect(Object.keys(gltf.programs).length).toEqual(1);
        });
    });

    var removeImages = RemoveUnusedProperties.removeImages;
    describe('removeImages', function() {
        it('removes an image', function() {
            var gltf = {
                "images": {
                    "Image0001": {
                        "name": "Image0001",
                        "uri": "Cesium_Logo_Flat.png"
                    },
                    "unusedId": {
                        "name": "An unused image for testing removal",
                        "uri": "unused.png"
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeImages(gltf);
            expect(gltf.images.unusedId).not.toBeDefined();
            expect(Object.keys(gltf.images).length).toEqual(1);
        });

        it('does not remove any images', function() {
            var gltf = {
                "images": {
                    "Image0001": {
                        "name": "Image0001",
                        "uri": "Cesium_Logo_Flat.png"
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeImages(gltf);
            expect(gltf.images.Image0001).toBeDefined();
            expect(Object.keys(gltf.images).length).toEqual(1);
        });
    });

    var removeSamplers = RemoveUnusedProperties.removeSamplers;
    describe('removeSamplers', function() {
        it('removes a sampler', function() {
            var gltf = {
                "samplers": {
                    "sampler_0": {
                        "magFilter": 9729,
                        "minFilter": 9987,
                        "wrapS": 10497,
                        "wrapT": 10497
                    },
                    "unusedSamplerId": {
                        "magFilter": 9729,
                        "minFilter": 9987,
                        "wrapS": 10497,
                        "wrapT": 10497
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeSamplers(gltf);
            expect(gltf.samplers.unusedSamplerId).not.toBeDefined();
            expect(Object.keys(gltf.samplers).length).toEqual(1);
        });

        it('does not remove any samplers', function() {
            var gltf = {
                "samplers": {
                    "sampler_0": {
                        "magFilter": 9729,
                        "minFilter": 9987,
                        "wrapS": 10497,
                        "wrapT": 10497
                    }
                },
                "textures": {
                    "texture_Image0001": {
                        "format": 6408,
                        "internalFormat": 6408,
                        "sampler": "sampler_0",
                        "source": "Image0001",
                        "target": 3553,
                        "type": 5121
                    }
                }
            };
            removeSamplers(gltf);
            expect(gltf.samplers.sampler_0).toBeDefined();
            expect(Object.keys(gltf.samplers).length).toEqual(1);
        });
    });

    var removeShaders = RemoveUnusedProperties.removeShaders;
    describe('removeShaders', function() {
        it('removes a shader', function() {
            var gltf = {
                "programs": {
                    "program_0": {
                        "attributes": [
                            "a_normal",
                            "a_position",
                            "a_texcoord0"
                        ],
                        "fragmentShader": "CesiumTexturedBoxTest0FS",
                        "vertexShader": "CesiumTexturedBoxTest0VS"
                    }
                },
                "shaders": {
                    "CesiumTexturedBoxTest0FS": {
                        "type": 35632,
                        "uri": "CesiumTexturedBoxTest0FS.glsl"
                    },
                    "CesiumTexturedBoxTest0VS": {
                        "type": 35633,
                        "uri": "CesiumTexturedBoxTest0VS.glsl"
                    },
                    "unusedShaderId": {
                        "type": 35633,
                        "uri": "CesiumTexturedBoxTest0VS.glsl"
                    }
                }
            };
            removeShaders(gltf);
            expect(gltf.shaders.unusedShaderId).not.toBeDefined();
            expect(Object.keys(gltf.shaders).length).toEqual(2);
        });

        it('does not remove any shaders', function() {
            var gltf = {
                "programs": {
                    "program_0": {
                        "attributes": [
                            "a_normal",
                            "a_position",
                            "a_texcoord0"
                        ],
                        "fragmentShader": "CesiumTexturedBoxTest0FS",
                        "vertexShader": "CesiumTexturedBoxTest0VS"
                    }
                },
                "shaders": {
                    "CesiumTexturedBoxTest0FS": {
                        "type": 35632,
                        "uri": "CesiumTexturedBoxTest0FS.glsl"
                    },
                    "CesiumTexturedBoxTest0VS": {
                        "type": 35633,
                        "uri": "CesiumTexturedBoxTest0VS.glsl"
                    }
                }
            };
            removeShaders(gltf);
            expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();
            expect(Object.keys(gltf.shaders).length).toEqual(2);
        });
    });

    var removePrimitiveAttributes = RemoveUnusedProperties.removePrimitiveAttributes;
    describe('removePrimitiveAttributes', function() {
        it('removes unused primitive attributes', function() {
            var gltf = {
                meshes : {
                    mesh : {
                        primitives: [
                            {
                                attributes : {
                                    KEEP_ATTRIBUTE_1 : 'accessor_1',
                                    KEEP_ATTRIBUTE_2 : 'accessor_2',
                                    DROP_ATTRIBUTE_3 : 'accessor_3',
                                    KEEP_ATTRIBUTE_4 : 'accessor_4',
                                    DROP_ATTRIBUTE_5 : 'accessor_5'
                                },
                                material : 'material'
                            }
                        ]
                    }
                },
                materials : {
                    material : {
                        technique : 'technique'
                    }
                },
                techniques : {
                    technique : {
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
                }
            };
            removePrimitiveAttributes(gltf);
            var attributes = gltf.meshes.mesh.primitives[0].attributes;
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
                    gltf.animations.animation_0.parameters.TIME = 'animAccessor_0';
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