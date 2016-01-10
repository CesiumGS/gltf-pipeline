'use strict';

var addDefaults = require('../../').addDefaults;
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;

describe('addDefaults', function() {
    it('Adds accessor properties', function() {
        var gltf = {
            "accessors": {
                "accessor_21": {
                    "bufferView": "bufferView_29",
                    "byteOffset": 0,
                    "componentType": 5123,
                    "count": 36,
                    "type": "SCALAR"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.accessors.accessor_21.byteStride).toEqual(0);
    });

    it('Adds animation properties', function() {
        var gltf = {
            "animations": {
                "animation_0": {
                    "channels": [
                        {
                            "sampler": "animation_0_rotation_sampler",
                            "target": {
                                "id": "Skeleton_torso_joint_1",
                                "path": "rotation"
                            }
                        }
                    ],
                    "parameters": {
                        "TIME": "animAccessor_0",
                        "rotation": "animAccessor_3",
                        "scale": "animAccessor_1",
                        "translation": "animAccessor_2"
                    },
                    "samplers": {
                        "animation_0_rotation_sampler": {
                            "input": "TIME",
                            "output": "rotation"
                        }
                    }
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.animations.animation_0.samplers.animation_0_rotation_sampler.interpolation).toEqual('LINEAR');
    });

    it('Adds animation empty properties', function() {
        var gltf = {
            "animations": {
                "animation_0" : {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.animations.animation_0.channels).toEqual([]);
        expect(gltf.animations.animation_0.parameters).toEqual({});
        expect(gltf.animations.animation_0.samplers).toEqual({});
    });

    it('Adds asset properties', function() {
        var gltf = {};

        addDefaults(gltf, undefined);
        expect(gltf.asset).toBeDefined();
        expect(gltf.asset.premultipliedAlpha).toEqual(false);
        expect(gltf.asset.profile).toBeDefined();
        expect(gltf.asset.profile.api).toEqual('WebGL');
        expect(gltf.asset.profile.version).toEqual('1.0.2');
    });

    it('Updates version property from glTF 0.8', function() {
        var gltf = {
            "version" : 0.8
        };

        addDefaults(gltf, undefined);
        expect(gltf.asset.version).toEqual('0.8');
    });

    it('Adds buffer properties', function() {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "byteLength": 840,
                    "uri": "CesiumTexturedBoxTest.bin"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.buffers.CesiumTexturedBoxTest.type).toEqual('arraybuffer');
    });

    // TODO: tests for materialDefaults()

    it('Adds mesh properties', function() {
        var gltf = {
            "meshes": {
                "Geometry_mesh002": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.Geometry_mesh002.primitives).toEqual([]);

        gltf = {
            "meshes": {
                "Geometry_mesh002": {
                    "primitives": [
                        {
                            "indices": "accessor_21",
                            "material": "Effect-Texture"
                        }
                    ]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.Geometry_mesh002.primitives[0].attributes).toBeDefined();
        expect(gltf.meshes.Geometry_mesh002.primitives[0].mode).toEqual(WebGLConstants.TRIANGLES);
    });

    it('glTF 0.8 to 1.0, primitive.primitive -> primitive.mode', function() {
        var gltf = {
            "meshes": {
                "Geometry_mesh002": {
                    "primitives": [
                        {
                            "indices": "accessor_21",
                            "material": "Effect-Texture",
                            "primitive": 5
                        }
                    ]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.Geometry_mesh002.primitives[0].mode).toEqual(WebGLConstants.TRIANGLE_STRIP);
    });

    it('Adds node properties', function() {
        var gltf = {
            "nodes": {
                "Geometry_mesh002Node": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.Geometry_mesh002Node.children).toEqual([]);
        expect(gltf.nodes.Geometry_mesh002Node.matrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        gltf = {
            "nodes": {
                "Geometry_mesh002Node": {
                    "translation": [0.0, 0.0, 0.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.Geometry_mesh002Node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes.Geometry_mesh002Node.scale).toEqual([1.0, 1.0, 1.0]);

        gltf = {
            "nodes": {
                "Geometry_mesh002Node": {
                    "scale": [1.0, 1.0, 1.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.Geometry_mesh002Node.translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes.Geometry_mesh002Node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
    });

    it('glTF 0.8 to 1.0, node.instanceSkin -> node', function() {
        var gltf = {
            "nodes": {
                "Geometry_mesh002Node": {
                    "instanceSkin": {
                        "skeletons": {},
                        "skin": {},
                        "meshes": {}
                    }
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.Geometry_mesh002Node.skeletons).toBeDefined();
        expect(gltf.nodes.Geometry_mesh002Node.skin).toBeDefined();
        expect(gltf.nodes.Geometry_mesh002Node.meshes).toBeDefined();
        expect(gltf.nodes.Geometry_mesh002Node.instanceSkin).not.toBeDefined();
    });

    it('glTF 0.8 to 1.0, axis angle -> quaternion', function() {
        var gltf = {
            "version": 0.8,
            "nodes": {
                "Geometry_mesh002Node": {
                    "rotation": [1.0, 0.0, 0.0, 0.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.Geometry_mesh002Node.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
    });

    it('Adds program properties', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.programs.program_0.attributes).toEqual([]);
    });

    it('Adds sampler properties', function() {
        var gltf = {
            "samplers": {
                "sampler_0": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.samplers.sampler_0.magFilter).toEqual(WebGLConstants.LINEAR);
        expect(gltf.samplers.sampler_0.minFilter).toEqual(WebGLConstants.NEAREST_MIPMAP_LINEAR);
        expect(gltf.samplers.sampler_0.wrapS).toEqual(WebGLConstants.REPEAT);
        expect(gltf.samplers.sampler_0.wrapT).toEqual(WebGLConstants.REPEAT);
    });

    it('Adds scene properties', function() {
        var gltf = {
            "scenes": {
                "defaultScene": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.scenes.defaultScene.nodes).toEqual([]);
    });

    it('Adds skin properties', function() {
        var gltf = {
            "skins": {
                "Armature_Cesium_Man_skin": {
                    "inverseBindMatrices": "IBM_Armature_Cesium_Man-skin",
                    "jointNames": [
                        "Skeleton_torso_joint_1"
                    ],
                    "name": "Armature"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.skins.Armature_Cesium_Man_skin.bindShapeMatrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });

    // TODO: tests for techniqueDefaults()

    it('Adds texture properties', function() {
        var gltf = {
            "textures": {
                "texture_Image0001": {
                    "format": 6408,
                    "sampler": "sampler_0",
                    "source": "Image0001"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.textures.texture_Image0001.format).toEqual(WebGLConstants.RGBA);
        expect(gltf.textures.texture_Image0001.internalFormat).toEqual(6408);
        expect(gltf.textures.texture_Image0001.target).toEqual(WebGLConstants.TEXTURE_2D);
        expect(gltf.textures.texture_Image0001.type).toEqual(WebGLConstants.UNSIGNED_BYTE);
    });


    it('glTF 0.8 to 1.0, allExtensions -> extensionsUsed', function() {
        var gltf = {
            "allExtensions": [
                "KHR_materials_common"
            ]
        };

        addDefaults(gltf, undefined);
        expect(gltf.allExtensions).not.toBeDefined();
        expect(gltf.extensionsUsed).toBeDefined();
    });

    it('Adds empty top-level properties', function() {
        var gltf = {};

        addDefaults(gltf, undefined);
        expect(gltf.extensionsUsed).toBeDefined();
        expect(gltf.accessors).toBeDefined();
        expect(gltf.animations).toBeDefined();
        expect(gltf.asset).toBeDefined();
        expect(gltf.buffers).toBeDefined();
        expect(gltf.bufferViews).toBeDefined();
        expect(gltf.cameras).toBeDefined();
        expect(gltf.images).toBeDefined();
        expect(gltf.materials).toBeDefined();
        expect(gltf.meshes).toBeDefined();
        expect(gltf.nodes).toBeDefined();
        expect(gltf.programs).toBeDefined();
        expect(gltf.samplers).toBeDefined();
        expect(gltf.scenes).toBeDefined();
        expect(gltf.shaders).toBeDefined();
        expect(gltf.skins).toBeDefined();
        expect(gltf.techniques).toBeDefined();
        expect(gltf.textures).toBeDefined();
    });
});
