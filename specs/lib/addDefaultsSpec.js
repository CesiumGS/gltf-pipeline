'use strict';

var addDefaults = require('../../lib/addDefaults');
var Cesium = require('cesium');
var clone = require('clone');
var WebGLConstants = Cesium.WebGLConstants;

describe('addDefaults', function() {
    it('Adds accessor properties', function() {
        var gltf = {
            "accessors": {
                "accessorId": {
                    "bufferView": "bufferViewId",
                    "byteOffset": 0,
                    "componentType": 5123,
                    "count": 36,
                    "type": "SCALAR"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.accessors.accessorId.byteStride).toEqual(0);
    });

    it('Adds animation properties', function() {
        var gltf = {
            "animations": {
                "animationId": {
                    "channels": [
                        {
                            "sampler": "samplerId",
                            "target": {
                                "id": "jointId",
                                "path": "rotation"
                            }
                        }
                    ],
                    "parameters": {
                        "TIME": "timeAccessorId",
                        "rotation": "rotationAccessorId",
                    },
                    "samplers": {
                        "samplerId": {
                            "input": "TIME",
                            "output": "rotation"
                        }
                    }
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.animations.animationId.samplers.samplerId.interpolation).toEqual('LINEAR');
    });

    it('Adds animation empty properties', function() {
        var gltf = {
            "animations": {
                "animationId" : {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.animations.animationId.channels).toEqual([]);
        expect(gltf.animations.animationId.parameters).toEqual({});
        expect(gltf.animations.animationId.samplers).toEqual({});
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
                "bufferId": {
                    "byteLength": 840,
                    "uri": "buffer.bin"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.buffers.bufferId.type).toEqual('arraybuffer');
    });

    it('does not change the material if the material has a technique', function() {
        var gltf = {
            "materials": {
                "blinn-1": {
                    "technique": "technique1",
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": "texture_file2",
                        "emission": [0, 0, 0, 1],
                        "shininess": 38.4,
                        "specular": [0, 0, 0, 1]
                    },
                    "name": "blinn1"
                }
            }
        };
        var materialsCopy = clone(gltf.materials);
        addDefaults(gltf);
        expect(gltf.materials).toEqual(materialsCopy);
    });

    it('do not change if the material has a non-KHR_materials_common extension', function() {
        var gltf = {
            "materials": {
                "lambert1": {
                    "extensions": {
                        "not_KHR_materials_common" : {
                            "technique" : "LAMBERT",
                            "values": {
                                "diffuse": [0.5, 0.5, 0.5, 1.0]
                            }
                        }
                    }
                }
            },
            "extensionsUsed": [
                "not_KHR_materials_common"
            ]
        };
        var materialsCopy = clone(gltf.materials);
        addDefaults(gltf);
        expect(gltf.materials).toEqual(materialsCopy);
    });

    it('generates a material with a lambert if no technique, extension, or specular/shininess values are given', function() {
        var gltf = {
            "materials": {
                "lambert-1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": "texture_file2",
                        "emission": [1, 0, 0, 1]
                    }
                }
            }
        };
        var expectValues = {
            "ambient": [0, 0, 0, 1],
            "diffuse": "texture_file2",
            "doubleSided": false,
            "emission": [1, 0, 0, 1],
            "specular": [0, 0, 0, 1],
            "shininess": 0.0,
            "transparency": 1.0,
            "transparent": false
        };
        addDefaults(gltf);
        expect(gltf.materials).toBeDefined();
        for (var materialID in gltf.materials) {
            if (gltf.materials.hasOwnProperty(materialID)) {
                expect(gltf.materials[materialID].values).toEqual(expectValues);
            }
        }
    });

    it('generates a material with a blinn if no technique or extension is given', function() {
        var gltf = {
            "materials": {
                "lambert-1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": "texture_file2",
                        "emission": [1, 0, 0, 1],
                        "shininess": 10.0
                    }
                }
            }
        };
        var expectValues = {
            "ambient": [0, 0, 0, 1],
            "diffuse": "texture_file2",
            "doubleSided": false,
            "emission": [1, 0, 0, 1],
            "specular": [0, 0, 0, 1],
            "shininess": 10.0,
            "transparency": 1.0,
            "transparent": false
        };
        addDefaults(gltf);
        expect(gltf.materials).toBeDefined();
        for (var materialID in gltf.materials) {
            if (gltf.materials.hasOwnProperty(materialID)) {
                expect(gltf.materials[materialID].values).toEqual(expectValues);
            }
        }
    });


    it('Adds mesh properties', function() {
        var gltf = {
            "meshes": {
                "meshId": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.meshId.primitives).toEqual([]);

        gltf = {
            "meshes": {
                "meshId": {
                    "primitives": [
                        {
                            "indices": "accessorId",
                            "material": "materialId"
                        }
                    ]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.meshId.primitives[0].attributes).toBeDefined();
        expect(gltf.meshes.meshId.primitives[0].mode).toEqual(WebGLConstants.TRIANGLES);
    });

    it('glTF 0.8 to 1.0, primitive.primitive -> primitive.mode', function() {
        var gltf = {
            "meshes": {
                "meshId": {
                    "primitives": [
                        {
                            "indices": "accessorId",
                            "material": "materialId",
                            "primitive": 5
                        }
                    ]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.meshes.meshId.primitives[0].mode).toEqual(WebGLConstants.TRIANGLE_STRIP);
    });

    it('Adds node properties', function() {
        var gltf = {
            "nodes": {
                "nodeId": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.nodeId.children).toEqual([]);
        expect(gltf.nodes.nodeId.matrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        gltf = {
            "nodes": {
                "nodeId": {
                    "translation": [0.0, 0.0, 0.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.nodeId.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes.nodeId.scale).toEqual([1.0, 1.0, 1.0]);

        gltf = {
            "nodes": {
                "nodeId": {
                    "scale": [1.0, 1.0, 1.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.nodeId.translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes.nodeId.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
    });

    it('glTF 0.8 to 1.0, node.instanceSkin -> node', function() {
        var gltf = {
            "nodes": {
                "nodeId": {
                    "instanceSkin": {
                        "skeletons": {},
                        "skin": {},
                        "meshes": {}
                    }
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.nodeId.skeletons).toBeDefined();
        expect(gltf.nodes.nodeId.skin).toBeDefined();
        expect(gltf.nodes.nodeId.meshes).toBeDefined();
        expect(gltf.nodes.nodeId.instanceSkin).not.toBeDefined();
    });

    it('glTF 0.8 to 1.0, axis angle -> quaternion', function() {
        var gltf = {
            "version": 0.8,
            "nodes": {
                "nodeId": {
                    "rotation": [1.0, 0.0, 0.0, 0.0]
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.nodes.nodeId.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
    });

    it('Adds program properties', function() {
        var gltf = {
            "programs": {
                "programId": {
                    "fragmentShader": "bufferId0FS",
                    "vertexShader": "bufferId0VS"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.programs.programId.attributes).toEqual([]);
    });

    it('Adds sampler properties', function() {
        var gltf = {
            "samplers": {
                "samplerId": {
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.samplers.samplerId.magFilter).toEqual(WebGLConstants.LINEAR);
        expect(gltf.samplers.samplerId.minFilter).toEqual(WebGLConstants.NEAREST_MIPMAP_LINEAR);
        expect(gltf.samplers.samplerId.wrapS).toEqual(WebGLConstants.REPEAT);
        expect(gltf.samplers.samplerId.wrapT).toEqual(WebGLConstants.REPEAT);
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
                "skinId": {
                    "inverseBindMatrices": "accessorId",
                    "jointNames": [
                        "jointId"
                    ],
                    "name": "Armature"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.skins.skinId.bindShapeMatrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });

    // TODO: tests for techniqueDefaults()

    it('Adds texture properties', function() {
        var gltf = {
            "textures": {
                "textureId": {
                    "format": 6408,
                    "sampler": "samplerId",
                    "source": "Image0001"
                }
            }
        };

        addDefaults(gltf, undefined);
        expect(gltf.textures.textureId.format).toEqual(WebGLConstants.RGBA);
        expect(gltf.textures.textureId.internalFormat).toEqual(6408);
        expect(gltf.textures.textureId.target).toEqual(WebGLConstants.TEXTURE_2D);
        expect(gltf.textures.textureId.type).toEqual(WebGLConstants.UNSIGNED_BYTE);
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
