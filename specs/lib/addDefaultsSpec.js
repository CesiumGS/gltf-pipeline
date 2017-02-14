'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var fs = require('fs');
var Promise = require('bluebird');

var WebGLConstants = Cesium.WebGLConstants;

var addDefaults = require('../../lib/addDefaults');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');

var fsReadFile = Promise.promisify(fs.readFile);

var transparentImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AcGERIfpcOGjwAAAQZJREFUGNMFwcErQ3EAwPHv7+3JEw2FFe+lZ9vpTTnYiR2MsyKuE8VB/ojdlZuDg4sVyUU7TVK7KG05jFgWPdt6oqWI5/E87/l8RNO8zyoylF4EtTeB6wWMhH2mNMG3B3KHDMemxOFdQEj4qN3tPDoS9Q+HxaiPdNkS5G5+SUV1xoYG6VNcRvvh9ClMS+hIZ6aLocZY0M+Zj1X59CMcXXmsJUO4dh7Z0HTiEZvN3DQDvcNk5mrYyU5q5SUK1QuktGpxkE/x8OpSaVqUSxt81bfYKewxkVhF9h1BjxJHyBW84I/dk23ebVieWWF2fB1hNZ6zSlsXxdt9rhtFgsDH0CZJJzK43g//gYBjzrZ4jf0AAAAASUVORK5CYII=';
var gltfTransparentPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestTransparent.gltf';

describe('addDefaults', function() {
    it('Adds accessor properties', function() {
        var gltf = {
            "accessors": [{
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5123,
                "count": 36,
                "type": "SCALAR"
            }]
        };

        addDefaults(gltf);
        var accessor = gltf.accessors[0];
        expect(accessor.byteStride).toEqual(0);
    });

    it('Adds animation properties', function() {
        var gltf = {
            "animations": [{
                "channels": [
                    {
                        "sampler": 0,
                        "target": {
                            "id": 0,
                            "path": "rotation"
                        }
                    }
                ],
                "samplers": [{
                    "input": 0,
                    "output": 1
                }]
            }]
        };

        addDefaults(gltf);
        expect(gltf.animations[0].samplers[0].interpolation).toEqual('LINEAR');
    });

    it('Adds animation empty properties', function() {
        var gltf = {
            "animations": [
                {}
            ]
        };

        addDefaults(gltf);
        expect(gltf.animations[0].channels).toEqual([]);
        expect(gltf.animations[0].samplers).toEqual([]);
    });

    it('Adds asset properties', function() {
        var gltf = {};

        addDefaults(gltf);
        expect(gltf.asset).toBeDefined();
        expect(gltf.asset.premultipliedAlpha).toEqual(false);
        expect(gltf.asset.profile).toBeDefined();
        expect(gltf.asset.profile.api).toEqual('WebGL');
        expect(gltf.asset.profile.version).toEqual('1.0');
    });

    it('Adds buffer properties', function() {
        var gltf = {
            "buffers": [{
                "byteLength": 840,
                "uri": "buffer.bin"
            }]
        };

        addDefaults(gltf);
        expect(gltf.buffers[0].type).toEqual('arraybuffer');
    });

    it('does not change the material if the material has a technique', function() {
        var gltf = {
            "techniques": [{
                "states": {
                    "enable": [
                        2929,
                        2884
                    ]
                }
            }],
            "materials": [{
                "technique": 0,
                "values": {
                    "ambient": [0, 0, 0, 1],
                    "diffuse": [1, 0, 0, 1],
                    "emission": [0],
                    "shininess": [38.4],
                    "specular": [0, 0, 0, 1]
                },
                "name": "blinn1"
            }]
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
            "textures": [{
                "format": 6408,
                "internalFormat": 6408,
                "sampler": 0,
                "source": 0,
                "target": 3553,
                "type": 5121
            }],
            "images": [{
                "name": "Image0001",
                "uri": transparentImageUri
            }],
            "materials": [{
                "values": {
                    "ambient": [0, 0, 0, 1],
                    "diffuse": [0],
                    "emission": [1, 0, 0, 1]
                }
            }]
        };

        addPipelineExtras(gltf);
        expect(loadGltfUris(gltf)
            .then(function() {
                addDefaults(gltf);
                var technique = gltf.techniques[0];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
    });

    it('generates a material with alpha blending if the diffuse color is transparent and no technique or extension values are given', function() {
        var gltf = {
            "materials": [
                {
                    "values": {
                        "ambient": [0, 0, 0, 1],
                        "diffuse": [1, 0, 0, 0.5],
                        "emission": [1, 0, 0, 1]
                    }
                }
            ]
        };

        addDefaults(gltf);
        var technique = gltf.techniques[0];
        expect(technique.states).toEqual(alphaBlendState);
    });

    it('modifies the material\'s technique to support alpha blending if the diffuse texture is transparent', function(done) {
        expect(fsReadFile(gltfTransparentPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                var originalState = gltf.techniques[0].states;
                expect(originalState).not.toEqual(alphaBlendState);
                return readGltf(gltfTransparentPath);
            })
            .then(function (gltf) {
                addDefaults(gltf);
                var technique = gltf.techniques[0];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
    });

    it('modifies the material\'s technique to support alpha blending if the diffuse color is transparent', function(done) {
        expect(fsReadFile(gltfTransparentPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                var originalState = gltf.techniques[0].states;
                expect(originalState).not.toEqual(alphaBlendState);
                return readGltf(gltfTransparentPath);
            })
            .then(function (gltf) {
                var material = gltf.materials[0];
                material.values.diffuse = [1, 0, 0, 0.5];
                addDefaults(gltf);
                var technique = gltf.techniques[0];
                expect(technique.states).toEqual(alphaBlendState);
            }), done).toResolve();
    });

    it('Adds _3DTILESDIFFUSE semantic to the technique\'s diffuse parameter when optimizeForCesium is true', function(done) {
        expect(readGltf(gltfTransparentPath)
            .then(function (gltf) {
                addDefaults(gltf, {
                    optimizeForCesium : true
                });
                var technique = gltf.techniques[0];
                expect(technique.parameters.diffuse.semantic).toEqual('_3DTILESDIFFUSE');
            }), done).toResolve();
    });

    it('Adds mesh properties', function() {
        var gltf = {
            "meshes": [
                {}
            ]
        };

        addDefaults(gltf);
        expect(gltf.meshes[0].primitives).toEqual([]);

        gltf = {
            "meshes": [
                {
                    "primitives": [
                        {
                            "indices": "accessorId",
                            "material": "materialId"
                        }
                    ]
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.meshes[0].primitives[0].attributes).toBeDefined();
        expect(gltf.meshes[0].primitives[0].mode).toEqual(WebGLConstants.TRIANGLES);
    });

    it('Adds node properties', function() {
        var gltf = {
            "nodes": [
                {}
            ]
        };

        addDefaults(gltf);
        var node = gltf.nodes[0];
        expect(node.children).toEqual([]);
        expect(node.matrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        expect(node.translation).not.toBeDefined();
        expect(node.rotation).not.toBeDefined();
        expect(node.scale).not.toBeDefined();

        gltf = {
            "nodes": [
                {
                    "translation": [0.0, 0.0, 0.0]
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.nodes[0].translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes[0].rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes[0].scale).toEqual([1.0, 1.0, 1.0]);
        expect(gltf.nodes[0].matrix).not.toBeDefined();

        gltf = {
            "nodes": [
                {
                    "scale": [1.0, 1.0, 1.0]
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.nodes[0].translation).toEqual([0.0, 0.0, 0.0]);
        expect(gltf.nodes[0].rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(gltf.nodes[0].scale).toEqual([1.0, 1.0, 1.0]);
        expect(gltf.nodes[0].matrix).not.toBeDefined();
    });

    it('Adds program properties', function() {
        var gltf = {
            "programs": [
                {
                    "fragmentShader": 0,
                    "vertexShader": 1
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.programs[0].attributes).toEqual([]);
    });

    it('Adds sampler properties', function() {
        var gltf = {
            "samplers": [
                {}
            ]
        };

        addDefaults(gltf);
        expect(gltf.samplers[0].magFilter).toEqual(WebGLConstants.LINEAR);
        expect(gltf.samplers[0].minFilter).toEqual(WebGLConstants.NEAREST_MIPMAP_LINEAR);
        expect(gltf.samplers[0].wrapS).toEqual(WebGLConstants.REPEAT);
        expect(gltf.samplers[0].wrapT).toEqual(WebGLConstants.REPEAT);
    });

    it('Adds scene properties', function() {
        var gltf = {
            "scenes": [
                {}
            ]
        };

        addDefaults(gltf);
        expect(gltf.scenes[0].nodes).toEqual([]);
    });

    it('Adds skin properties', function() {
        var gltf = {
            "skins": [
                {
                    "inverseBindMatrices": 0,
                    "jointNames": [
                        "jointId"
                    ],
                    "name": "Armature"
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.skins[0].bindShapeMatrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });

    it('Adds texture properties', function() {
        var gltf = {
            "textures": [
                {
                    "format": 6408,
                    "sampler": 0,
                    "source": 0
                }
            ]
        };

        addDefaults(gltf);
        expect(gltf.textures[0].format).toEqual(WebGLConstants.RGBA);
        expect(gltf.textures[0].internalFormat).toEqual(6408);
        expect(gltf.textures[0].target).toEqual(WebGLConstants.TEXTURE_2D);
        expect(gltf.textures[0].type).toEqual(WebGLConstants.UNSIGNED_BYTE);
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

    it('Adds the default material if a mesh has an undefined material', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {},
                        {}
                    ]
                }
            ]
        };
        addDefaults(gltf);

        var mesh = gltf.meshes[0];
        var meshMaterial = mesh.primitives[0].material;
        expect(meshMaterial).toBeDefined();
        expect(mesh.primitives[1].material).toEqual(meshMaterial);

        expect(gltf.materials[meshMaterial]).toBeDefined();
    });

    it('Adds the default technique, program and shader if a material has an undefined technique', function() {
        var gltf = {
            materials: [
                {},
                {}
            ]
        };
        addDefaults(gltf);

        var techniqueId = gltf.materials[0].technique;
        expect(gltf.materials[1].technique).toEqual(techniqueId);
        var technique = gltf.techniques[techniqueId];
        expect(technique).toBeDefined();
        var programId = technique.program;
        var program = gltf.programs[programId];
        expect(program).toBeDefined();
        var vertexShaderId = program.vertexShader;
        var fragmentShaderId = program.fragmentShader;
        var vertexShader = gltf.shaders[vertexShaderId];
        var fragmentShader = gltf.shaders[fragmentShaderId];
        expect(vertexShader).toBeDefined();
        expect(fragmentShader).toBeDefined();
    });

    it('Selects a default scene if none is present', function() {
       var gltf = {
           scenes: [
               {}
           ]
       };
       addDefaults(gltf);

       expect(gltf.scene).toEqual(0);
    });
});
