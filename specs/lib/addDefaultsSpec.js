'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var fsExtra = require('fs-extra');
var Promise = require('bluebird');

var WebGLConstants = Cesium.WebGLConstants;

var addDefaults = require('../../lib/addDefaults');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');

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

        addDefaults(gltf);
        var accessor = gltf.accessors.accessorId;
        expect(accessor.byteStride).toEqual(0);
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

        addDefaults(gltf);
        expect(gltf.animations.animationId.samplers.samplerId.interpolation).toEqual('LINEAR');
    });

    it('Adds animation empty properties', function() {
        var gltf = {
            "animations": {
                "animationId" : {
                }
            }
        };

        addDefaults(gltf);
        expect(gltf.animations.animationId.channels).toEqual([]);
        expect(gltf.animations.animationId.parameters).toEqual({});
        expect(gltf.animations.animationId.samplers).toEqual({});
    });

    it('Adds asset properties', function() {
        var gltf = {};

        addDefaults(gltf);
        expect(gltf.asset).toBeDefined();
        expect(gltf.asset.premultipliedAlpha).toEqual(false);
        expect(gltf.asset.profile).toBeDefined();
        expect(gltf.asset.profile.api).toEqual('WebGL');
        expect(gltf.asset.profile.version).toEqual('1.0.3');
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

        addDefaults(gltf);
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
        expect(loadGltfUris(gltf)
            .then(function() {
                addDefaults(gltf);
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
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
        expect(fsExtra.readFile(gltfTransparentPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                var originalState = gltf.techniques[Object.keys(gltf.techniques)[0]].states;
                expect(originalState).not.toEqual(alphaBlendState);
                return readGltf(gltfTransparentPath);
            })
            .then(function (gltf) {
                addDefaults(gltf);
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
    });

    it('modifies the material\'s technique to support alpha blending if the diffuse color is transparent', function(done) {
        expect(fsExtra.readFile(gltfTransparentPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                var originalState = gltf.techniques[Object.keys(gltf.techniques)[0]].states;
                expect(originalState).not.toEqual(alphaBlendState);
                return readGltf(gltfTransparentPath);
            })
            .then(function (gltf) {
                var material = gltf.materials[Object.keys(gltf.materials)[0]];
                material.values.diffuse = [1, 0, 0, 0.5];
                addDefaults(gltf);
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
    });

    it('Adds _3DTILESDIFFUSE semantic to the technique\'s diffuse parameter when optimizeForCesium is true', function(done) {
        expect(readGltf(gltfTransparentPath)
            .then(function (gltf) {
                addDefaults(gltf, {
                    optimizeForCesium : true
                });
                var technique = gltf.techniques[Object.keys(gltf.techniques)[0]];
                expect(technique.parameters.diffuse.semantic).toEqual('_3DTILESDIFFUSE');
            }), done).toResolve();
    });

    it('Adds mesh properties', function() {
        var gltf = {
            "meshes": {
                "meshId": {
                }
            }
        };

        addDefaults(gltf);
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

        addDefaults(gltf);
        expect(gltf.meshes.meshId.primitives[0].attributes).toBeDefined();
        expect(gltf.meshes.meshId.primitives[0].mode).toEqual(WebGLConstants.TRIANGLES);
    });

    it('Adds node properties', function() {
        var gltf = {
            "nodes": {
                "nodeId": {
                }
            }
        };

        addDefaults(gltf);
        var node = gltf.nodes.nodeId;
        expect(node.children).toEqual([]);
        expect(node.matrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        expect(node.translation).not.toBeDefined();
        expect(node.rotation).not.toBeDefined();
        expect(node.scale).not.toBeDefined();

        gltf = {
            "nodes": {
                "nodeId": {
                    "translation": [0.0, 0.0, 0.0]
                }
            }
        };

        addDefaults(gltf);
        expect(gltf.nodes.nodeId.translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes.nodeId.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes.nodeId.scale).toEqual([1.0, 1.0, 1.0]);
        expect(gltf.nodes.nodeId.matrix).not.toBeDefined();

        gltf = {
            "nodes": {
                "nodeId": {
                    "scale": [1.0, 1.0, 1.0]
                }
            }
        };

        addDefaults(gltf);
        expect(gltf.nodes.nodeId.translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes.nodeId.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes.nodeId.scale).toEqual([1.0, 1.0, 1.0]);
        expect(gltf.nodes.nodeId.matrix).not.toBeDefined();
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

        addDefaults(gltf);
        expect(gltf.programs.programId.attributes).toEqual([]);
    });

    it('Adds sampler properties', function() {
        var gltf = {
            "samplers": {
                "samplerId": {
                }
            }
        };

        addDefaults(gltf);
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

        addDefaults(gltf);
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

        addDefaults(gltf);
        expect(gltf.skins.skinId.bindShapeMatrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });

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

        addDefaults(gltf);
        expect(gltf.textures.textureId.format).toEqual(WebGLConstants.RGBA);
        expect(gltf.textures.textureId.internalFormat).toEqual(6408);
        expect(gltf.textures.textureId.target).toEqual(WebGLConstants.TEXTURE_2D);
        expect(gltf.textures.textureId.type).toEqual(WebGLConstants.UNSIGNED_BYTE);
    });

    it('Adds empty top-level properties', function() {
        var gltf = {};

        addDefaults(gltf);
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
