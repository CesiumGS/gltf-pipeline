'use strict';

var fs = require('fs');
var addDefaults = require('../../lib/addDefaults');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var Cesium = require('cesium');
var clone = require('clone');
var WebGLConstants = Cesium.WebGLConstants;

var transparentImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AcGERIfpcOGjwAAAQZJREFUGNMFwcErQ3EAwPHv7+3JEw2FFe+lZ9vpTTnYiR2MsyKuE8VB/ojdlZuDg4sVyUU7TVK7KG05jFgWPdt6oqWI5/E87/l8RNO8zyoylF4EtTeB6wWMhH2mNMG3B3KHDMemxOFdQEj4qN3tPDoS9Q+HxaiPdNkS5G5+SUV1xoYG6VNcRvvh9ClMS+hIZ6aLocZY0M+Zj1X59CMcXXmsJUO4dh7Z0HTiEZvN3DQDvcNk5mrYyU5q5SUK1QuktGpxkE/x8OpSaVqUSxt81bfYKewxkVhF9h1BjxJHyBW84I/dk23ebVieWWF2fB1hNZ6zSlsXxdt9rhtFgsDH0CZJJzK43g//gYBjzrZ4jf0AAAAASUVORK5CYII=';
var gltfTransparentPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestTransparent.gltf';

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
        var accessor = gltf.accessors.accessorId;
        expect(accessor.byteStride).toEqual(0);
        expect(accessor.min).toBeDefined();
        expect(accessor.max).toBeDefined();
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
                        "rotation": "rotationAccessorId"
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
            "techniques": {
                "technique1": {
                    "states": {
                        "enable": [
                            2929,
                            2884
                        ]
                    }
                }
            },
            "materials": {
                "blinn-1": {
                    "technique": "technique1",
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 1],
                        "emission": "texture_file2",
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

    it('generates a material if no technique or extension values are given', function() {
        var gltf = {
            "materials": {
                "material1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 1],
                        "emission": "texture_file2"
                    }
                }
            }
        };
        var expectValues = {
            "ambient": [0, 0, 0, 1],
            "diffuse": [1, 0, 0, 1],
            "emission": "texture_file2",
            "specular": [0, 0, 0, 1],
            "shininess": 0.0,
            "transparency": 1.0
        };

        var expectedStates = {
            enable: [
                WebGLConstants.CULL_FACE,
                WebGLConstants.DEPTH_TEST
            ]
        };

        var options = {
            specularTechnique: 'PHONG',
            diffuseTechnique: 'CONSTANT'
        };

        var gltfClone;
        var materialID;

        // default lambert
        gltfClone = clone(gltf);
        addDefaults(gltfClone);
        expect(Object.keys(gltfClone.materials).length > 0).toEqual(true);
        expect(Object.keys(gltfClone.techniques).length > 0).toEqual(true);
        expect(gltfClone.techniques[Object.keys(gltfClone.techniques)[0]].states).toEqual(expectedStates);

        for (materialID in gltfClone.materials) {
            if (gltfClone.materials.hasOwnProperty(materialID)) {
                expect(gltfClone.materials[materialID].values).toEqual(expectValues);
            }
        }

        // constant
        gltfClone = clone(gltf);
        addDefaults(gltfClone, options);
        expect(Object.keys(gltfClone.materials).length > 0).toEqual(true);
        expect(Object.keys(gltfClone.techniques).length > 0).toEqual(true);
        expect(gltfClone.techniques[Object.keys(gltfClone.techniques)[0]].states).toEqual(expectedStates);
        for (materialID in gltfClone.materials) {
            if (gltfClone.materials.hasOwnProperty(materialID)) {
                expect(gltfClone.materials[materialID].values).toEqual(expectValues);
            }
        }

        gltf = {
            "materials": {
                "lambert-1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 1],
                        "emission": "texture_file2",
                        "shininess": 10.0
                    }
                }
            }
        };

        expectValues = {
            "ambient": [0, 0, 0, 1],
            "diffuse": [1, 0, 0, 1],
            "emission": "texture_file2",
            "specular": [0, 0, 0, 1],
            "shininess": 10.0,
            "transparency": 1.0
        };

        // default blinn
        gltfClone = clone(gltf);
        addDefaults(gltfClone);
        expect(Object.keys(gltfClone.materials).length > 0).toEqual(true);
        expect(Object.keys(gltfClone.techniques).length > 0).toEqual(true);
        expect(gltfClone.techniques[Object.keys(gltfClone.techniques)[0]].states).toEqual(expectedStates);
        for (materialID in gltfClone.materials) {
            if (gltfClone.materials.hasOwnProperty(materialID)) {
                expect(gltfClone.materials[materialID].values).toEqual(expectValues);
            }
        }

        // phong
        gltfClone = clone(gltf);
        addDefaults(gltfClone, options);
        expect(Object.keys(gltfClone.materials).length > 0).toEqual(true);
        expect(Object.keys(gltfClone.techniques).length > 0).toEqual(true);
        expect(gltfClone.techniques[Object.keys(gltfClone.techniques)[0]].states).toEqual(expectedStates);
        for (materialID in gltfClone.materials) {
            if (gltfClone.materials.hasOwnProperty(materialID)) {
                expect(gltfClone.materials[materialID].values).toEqual(expectValues);
            }
        }

        // check that shader source is in extras._pipeline.source
        var shaders = gltfClone.shaders;
        expect(Object.keys(shaders).length > 0).toEqual(true);
        for (var shaderID in shaders) {
            if (shaders.hasOwnProperty(shaderID)) {
                var shader = shaders[shaderID];
                expect(shader.extras._pipeline.source).toBeDefined();
            }
        }
    });

    var alphaBlendState = {
        enable : [
            WebGLConstants.DEPTH_TEST,
            WebGLConstants.BLEND
        ],
        depthMask : false,
        functions : {
            blendEquationSeparate : [
                WebGLConstants.FUNC_ADD,
                WebGLConstants.FUNC_ADD
            ],
            blendFuncSeparate : [
                WebGLConstants.ONE,
                WebGLConstants.ONE_MINUS_SRC_ALPHA,
                WebGLConstants.ONE,
                WebGLConstants.ONE_MINUS_SRC_ALPHA
            ]
        }
    };

    it('generates a material with alpha blending if the diffuse texture is transparent and no technique or extension values are given', function(done) {
        var gltf = {
            "textures": {
                "texture0001": {
                    "format": 6408,
                    "internalFormat": 6408,
                    "sampler": "sampler_0",
                    "source": "Image0001",
                    "target": 3553,
                    "type": 5121
                }
            },
            "images": {
                "Image0001": {
                    "name": "Image0001",
                    "uri": transparentImageUri
                }
            },
            "materials": {
                "material1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": "texture0001",
                        "emission": [1, 0, 0, 1]
                    }
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, {}, function(err, gltf) {
            if (err) {
                throw err;
            }
            addDefaults(gltf);
            var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
            expect(technique.states).toEqual(alphaBlendState);
            done();
        });
    });

    it('generates a material with alpha blending if the diffuse color is transparent and no technique or extension values are given', function() {
        var gltf = {
            "materials": {
                "material1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 0.5],
                        "emission": [1, 0, 0, 1]
                    }
                }
            }
        };

        addDefaults(gltf);
        var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
        expect(technique.states).toEqual(alphaBlendState);
    });

    it('modifies the material\'s technique to support alpha blending if the diffuse texture is transparent', function(done) {
        fs.readFile(gltfTransparentPath, function(err, data) {
            if (err) {
                throw err;
            }
            var gltf = JSON.parse(data);
            var originalState = gltf.techniques[Object.keys(gltf.techniques)[0]].states;
            expect(originalState).not.toEqual(alphaBlendState);
            readGltf(gltfTransparentPath, {}, function (gltf) {
                addDefaults(gltf);
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.states).toEqual(alphaBlendState);
                done();
            });
        });
    });

    it('modifies the material\'s technique to support alpha blending if the diffuse color is transparent', function(done) {
        fs.readFile(gltfTransparentPath, function(err, data) {
            if (err) {
                throw err;
            }
            var gltf = JSON.parse(data);
            var originalState = gltf.techniques[Object.keys(gltf.techniques)[0]].states;
            expect(originalState).not.toEqual(alphaBlendState);

            var options = {};
            readGltf(gltfTransparentPath, options, function (gltf) {
                var material = gltf.materials[Object.keys(gltf.materials)[0]];
                material.values.diffuse = [1, 0, 0, 0.5];
                addDefaults(gltf);
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.states).toEqual(alphaBlendState);
                done();
            });
        });
    });

    it('generates techniques and nodes for KHR_materials_common lights', function() {
        var gltf = {
            "materials": {
                "material1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [0, 0, 0, 1],
                        "emission": [0, 0, 0, 1]
                    }
                }
            },
            "nodes": {
                "node1": {
                    "children": [],
                    "extensions": {
                        "KHR_materials_common": {
                            "light": "ambientLight"
                        }
                    }
                },
                "node2": {
                    "children": [],
                    "extensions": {
                        "KHR_materials_common": {
                            "light": "directionalLight"
                        }
                    }
                },
                "node3": {
                    "children": [],
                    "extensions": {
                        "KHR_materials_common": {
                            "light": "pointLight"
                        }
                    }
                },
                "node4": {
                    "children": [],
                    "extensions": {
                        "KHR_materials_common": {
                            "light": "spotLight"
                        }
                    }
                }

            },
            "extensionsUsed": [
                "KHR_materials_common"
            ],
            "extensions": {
                "KHR_materials_common" : {
                    "lights": {
                        "ambientLight": {
                            "ambient": {
                                "color": [
                                    1,
                                    1,
                                    1
                                ]
                            },
                            "type": "ambient"
                        },
                        "directionalLight": {
                            "directional": {
                                "color": [
                                    1,
                                    1,
                                    1
                                ]
                            },
                            "type": "directional"
                        },
                        "pointLight": {
                            "point": {
                                "color": [
                                    1,
                                    1,
                                    1
                                ]
                            },
                            "constantAttenuation": 0.0,
                            "distance": 0.0,
                            "linearAttenuation": 1.0,
                            "quadraticAttenuation":1.0,
                            "type": "point"
                        },
                        "spotLight": {
                            "spot": {
                                "spot": [
                                    1,
                                    1,
                                    1
                                ]
                            },
                            "constantAttenuation": 0.0,
                            "distance": 0.0,
                            "linearAttenuation": 1.0,
                            "quadraticAttenuation":1.0,
                            "falloffAngle": 1.5,
                            "falloffExponent": 0.0,
                            "type": "spot"
                        }
                    }
                }
            }
        };
        var expectValues = {
            "ambient": [0, 0, 0, 1],
            "diffuse": [0, 0, 0, 1],
            "emission": [0, 0, 0, 1],
            "specular": [0, 0, 0, 1],
            "shininess": 0.0,
            "transparency": 1.0
        };
        addDefaults(gltf);
        expect(Object.keys(gltf.materials).length > 0).toEqual(true);
        expect(Object.keys(gltf.techniques).length > 0).toEqual(true);
        for (var materialID in gltf.materials) {
            if (gltf.materials.hasOwnProperty(materialID)) {
                expect(gltf.materials[materialID].values).toEqual(expectValues);
            }
        }
    });

    it('modelMaterialCommon uses the Cesium sun as its default light source when the optimizeForCesium flag is set', function() {
        var gltf = {
            "materials": {
                "material1": {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 1],
                        "emission": "texture_file2"
                    }
                }
            }
        };

        var gltfClone = clone(gltf);
        addDefaults(gltfClone, {
            optimizeForCesium : true
        });
        var fragmentShaderSource = gltfClone.shaders.fragmentShader0.extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(true);

        gltfClone = clone(gltf);
        addDefaults(gltfClone);
        fragmentShaderSource = gltfClone.shaders.fragmentShader0.extras._pipeline.source;
        expect(fragmentShaderSource.indexOf('czm_sunDirectionEC') > -1).toBe(false);
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
