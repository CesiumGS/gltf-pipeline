'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var CesiumMath = Cesium.Math;
var Cartesian3 = Cesium.Cartesian3;
var Matrix4 = Cesium.Matrix4;

var bakeAmbientOcclusion = require('../../lib/bakeAmbientOcclusion');
var NodeHelpers = require('../../lib/NodeHelpers');
var readGltf = require('../../lib/readGltf');
var StaticUniformGrid = require('../../lib/StaticUniformGrid');

var generateOptions = bakeAmbientOcclusion._generateOptions;
var generateRaytracerScene = bakeAmbientOcclusion._generateRaytracerScene;
var computeAmbientOcclusionAt = bakeAmbientOcclusion._computeAmbientOcclusionAt;
var raytraceAtTriangleCenters = bakeAmbientOcclusion._raytraceAtTriangleCenters;
var raytraceOverTriangleSamples = bakeAmbientOcclusion._raytraceOverTriangleSamples;
var extractInstructionWithFunctionCall = bakeAmbientOcclusion._extractInstructionWithFunctionCall;
var injectGlslAfterInstructionContaining = bakeAmbientOcclusion._injectGlslAfterInstructionContaining;

var boxOverGroundGltfPath = './specs/data/ambientOcclusion/cube_over_ground.gltf';

function cloneGltfWithJimps(gltf) {
    var gltfClone = clone(gltf);

    // clone the jimps too
    var originalJimp = gltf.extras._pipeline.jimpScratch;
    gltfClone.extras._pipeline.jimpScratch = originalJimp.clone();
    var images = gltfClone.images;
    for (var imageID in images) {
        if (images.hasOwnProperty(imageID)) {
            var image = images[imageID];
            originalJimp = gltf.images[imageID].extras._pipeline.jimpImage;
            image.extras._pipeline.jimpImage = originalJimp.clone();
        }
    }
    return gltfClone;
}

describe('AmbientOcclusion', function() {
    var boxOverGroundGltf;

    var indices = [0,1,2,0,2,3];
    var indicesBuffer = new Buffer(indices.length * 2);
    var indicesLength = indices.length;
    var i;
    for (i = 0; i < indicesLength; i++) {
        indicesBuffer.writeUInt16LE(indices[i], i * 2);
    }
    var positions = [
        0,0,0,
        0,1,0,
        1,1,0,
        1,0,0
    ];
    var normals = [
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1
    ];
    var uvs = [
        0.25,0.25,
        0.75,0.25,
        0.75,0.75,
        0.25,0.75
    ];
    var positionsLength = positions.length;
    var positionsBuffer = new Buffer(positionsLength * 4);
    for (i = 0; i < positionsLength; i++) {
        positionsBuffer.writeFloatLE(positions[i], i * 4);
    }
    var normalsLength = normals.length;
    var normalsBuffer = new Buffer(normalsLength * 4);
    for (i = 0; i < normalsLength; i++) {
        normalsBuffer.writeFloatLE(normals[i], i * 4);
    }
    var uvsLength = uvs.length;
    var uvsBuffer = new Buffer(uvsLength * 4);
    for (i = 0; i < uvsLength; i++) {
        uvsBuffer.writeFloatLE(uvs[i], i * 4);
    }

    var dataBuffer = Buffer.concat([indicesBuffer, positionsBuffer, normalsBuffer, uvsBuffer]);

    var testGltf = {
        "accessors": {
            "accessor_index": {
                "bufferView": "index_view",
                "byteOffset": 0,
                "componentType": 5123,
                "count": 6,
                "type": "SCALAR"
            },
            "accessor_position": {
                "bufferView": "position_view",
                "byteOffset": 0,
                "componentType": 5126,
                "count": 4,
                "type": "VEC3"
            },
            "accessor_normal": {
                "bufferView": "normal_view",
                "byteOffset": 0,
                "componentType": 5126,
                "count": 4,
                "type": "VEC3"
            },
            "accessor_uv": {
                "bufferView": "uv_view",
                "byteOffset": 0,
                "componentType": 5126,
                "count": 4,
                "type": "VEC2"
            }
        },
        "bufferViews": {
            "index_view": {
                "buffer": "buffer_0",
                "byteOffset": 0,
                "byteLength": 6 * 2,
                "target": 34963
            },
            "position_view": {
                "buffer": "buffer_0",
                "byteOffset": 6 * 2,
                "byteLength": 4 * 3 * 4,
                "target": 34962
            },
            "normal_view": {
                "buffer": "buffer_0",
                "byteOffset": 6 * 2 + (4 * 3 * 4),
                "byteLength": 4 * 3 * 4,
                "target": 34962
            },
            "uv_view": {
                "buffer": "buffer_0",
                "byteOffset": 6 * 2 + (4 * 3 * 4) * 2,
                "byteLength": 4 * 2 * 4,
                "target": 34962
            }
        },
        "buffers": {
            "buffer_0": {
                "uri": "data:",
                "byteLength": indicesLength * 2 + (positionsLength + normalsLength + uvsLength) * 4,
                "extras": {
                    "_pipeline": {
                        "source": dataBuffer
                    }
                }
            }
        },
        "scene": "defaultScene",
        "scenes": {
            "defaultScene": {
                "nodes": [
                    "squareNode"
                ]
            }
        },
        "nodes": {
            "squareNode": {
                "children": [],
                "matrix": [
                    2, 0, 0, 0,
                    0, 2, 0, 0,
                    0, 0, 2, 0,
                    0, 0, 0, 1
                ],
                "meshes": [
                    "mesh_square"
                ],
                "name": "square",
                "extras": {
                    "_pipeline": {}
                }
            }
        },
        "meshes": {
            "mesh_square": {
                "name": "square",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": "accessor_position",
                            "NORMAL": "accessor_normal",
                            "TEXCOORD_0": "accessor_uv"
                        },
                        "indices": "accessor_index",
                        "extras": {
                            "_pipeline": {}
                        }
                    }
                ]
            }
        }
    };

    beforeAll(function(done) {
        expect(readGltf(boxOverGroundGltfPath, {})
            .then(function(gltf) {
                boxOverGroundGltf = gltf;
            }), done).toResolve();
    });

    // tetrahedron
    var point0 = new Cartesian3(0.0, -1.0, 1.0);
    var point1 = new Cartesian3(1.0, -1.0, -1.0);
    var point2 = new Cartesian3(-1.0, -1.0, -1.0);
    var point3 = new Cartesian3(0.0, 1.0, 0.0);

    var tetrahedron = [
        [point0, point1, point2],
        [point0, point1, point3],
        [point1, point2, point3],
        [point2, point0, point3]
    ];

    var tetrahedronGrid = StaticUniformGrid.fromTriangleSoup(tetrahedron, 10.0);

    // data for an equilateral triangle whose center is inside the tetrahedron
    var normal = new Cartesian3(0.0, 1.0, 0.0);
    var equilateralBufferDataByAccessor = {
        indices : [0, 1, 2],
        positions : [
            new Cartesian3(0.0, 0.0, 1.0),
            new Cartesian3(-0.5, 0.0, -Math.sqrt(3.0) / 6.0),
            new Cartesian3(0.5, 0.0, -Math.sqrt(3.0) / 6.0)
        ],
        normals : [
            normal,
            normal,
            normal
        ]
    };

    it('correctly processes a basic 2-triangle square primitive', function() {
        var options = {
            resolution : 10,
            toTexture : true,
            sceneID : testGltf.scene,
            rayDistance : 10.0
        };
        var raytracerScene = generateRaytracerScene(testGltf, options);
        var triangleSoup = raytracerScene.triangleGrid.items;

        // because of the uniform scale, expect triangles to be bigger
        var point0 = new Cartesian3(0.0, 0.0, 0.0);
        var point1 = new Cartesian3(0.0, 2.0, 0.0);
        var point2 = new Cartesian3(2.0, 2.0, 0.0);
        var point3 = new Cartesian3(2.0, 0.0, 0.0);

        ////////// check triangle soup //////////
        expect(triangleSoup.length).toEqual(2);

        var triangle0 = triangleSoup[0];
        var triangle1 = triangleSoup[1];

        expect(Cartesian3.equalsEpsilon(triangle0[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle0[1], point1, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle0[2], point2, CesiumMath.EPSILON7)).toEqual(true);

        expect(Cartesian3.equalsEpsilon(triangle1[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle1[1], point2, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle1[2], point3, CesiumMath.EPSILON7)).toEqual(true);

        // check ao buffers
        var aoBuffersByPrimitive = raytracerScene.aoBufferByPrimitive;
        var aoBuffer = aoBuffersByPrimitive.mesh_square_0;
        expect(aoBuffer).toBeDefined();
        expect(aoBuffer.resolution).toEqual(10);

        // check generated ray distance
        expect(raytracerScene.rayDistance).toEqual(10.0);
    });

    it('correctly generates a ground plane just below the minimum of the scene.', function() {
        var options = {
            rayDistance : 1.0,
            groundPlane : true,
            nearCull : CesiumMath.EPSILON4,
            sceneID : testGltf.scene
        };
        var raytracerScene = generateRaytracerScene(testGltf, options);
        var triangleSoup = raytracerScene.triangleGrid.items;

        // ground plane size is based on the near culling distance, scene size, and maximum ray depth.
        var point0 = new Cartesian3(-2.0, -0.00015, -2.0);
        var point1 = new Cartesian3(4.0, -0.00015, -2.0);
        var point2 = new Cartesian3(4.0, -0.00015, 2.0);
        var point3 = new Cartesian3(-2.0, -0.00015, 2.0);

        ////////// check triangle soup //////////
        var itemsCount = triangleSoup.length;
        // Because of how the grid cell indices are laid out,
        // we should expect the lowest items in the scene to be at the end of the item list.
        var groundPlane1 = triangleSoup[itemsCount - 2];
        var groundPlane2 = triangleSoup[itemsCount - 1];

        expect(Cartesian3.equalsEpsilon(groundPlane1[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(groundPlane1[1], point1, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(groundPlane1[2], point2, CesiumMath.EPSILON7)).toEqual(true);

        expect(Cartesian3.equalsEpsilon(groundPlane2[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(groundPlane2[1], point2, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(groundPlane2[2], point3, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('generates all occluded (1.0) for samples inside a closed tetrahedron', function() {
        var normals = [];
        var i;
        for (i = 0; i < 6; i++) {
            var values = [0.0, 0.0, 0.0];
            values[i % 3] = (i % 2) ? 1.0 : -1.0;
            var newNormal = new Cartesian3(values[0], values[1], values[2]);
            normals.push(newNormal);
        }

        var samples = new Array(9).fill(0.0);

        var texelPoints = [];

        for (i = 0; i < 6; i++) {
            texelPoints.push({
                position: Cartesian3.ZERO,
                normal: normals[i]
            });
        }

        for (i = 0; i < 6; i++) {
            var texel = texelPoints[i];
            samples[i] = computeAmbientOcclusionAt({
                position : texel.position,
                normal : texel.normal,
                numberRays : 16,
                sqrtNumberRays : 4,
                triangleGrid : tetrahedronGrid,
                nearCull : 0.001,
                rayDistance : 10.0});
        }

        for (i = 0; i < 6; i++) {
            expect(samples[i]).toEqual(16.0);
        }
    });

    it('generates various levels of occlusion for samples in the mouth of an open tetrahedron', function() {
        var openTetrahedron = [tetrahedron[1], tetrahedron[2], tetrahedron[3]];

        var samples = new Array(4).fill(0.0);

        var bottomCenter = new Cartesian3(0.0, -1.0, 0.0);

        var texelPoints = [
            {
                position: bottomCenter,
                normal: new Cartesian3(0.0, 1.0, 0.0)
            },
            {
                position: bottomCenter,
                normal: new Cartesian3(0.0, -1.0, 0.0)
            },
            {
                position: bottomCenter,
                normal: new Cartesian3(1.0, 0.0, 0.0)
            }
        ];

        for (var i = 0; i < 3; i++) {
            var texel = texelPoints[i];
            samples[i] += computeAmbientOcclusionAt({
                position : texel.position,
                normal : texel.normal,
                numberRays : 16,
                sqrtNumberRays : 4,
                triangleGrid : StaticUniformGrid.fromTriangleSoup(openTetrahedron, 10.0),
                nearCull : 0.001,
                rayDistance : 10.0});
        }

        expect(samples[0]).toEqual(16);
        expect(samples[1]).toEqual(0); // randomized, but stratification should ensure this.
        expect(samples[2] > 6 && samples[2] < 10).toEqual(true); // randomized, but stratification should ensure this.
    });

    it('modifies existing images, textures, and materials in place', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        var options = {
            numberRays: 0,
            resolution: 4,
            toTexture: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(3);
    });

    it('adds additional images as needed', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        // remove some images
        var imageID = 'Untitled';
        var image = boxOverGroundGltfClone.images[imageID];
        boxOverGroundGltfClone.images = {};
        boxOverGroundGltfClone.images[imageID] = image;
        var textures = boxOverGroundGltfClone.textures;
        for (var textureID in textures) {
            if (textures.hasOwnProperty(textureID)) {
                var texture = textures[textureID];
                texture.source = imageID;
            }
        }

        var options = {
            numberRays: 0,
            resolution: 4,
            toTexture: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(3);
    });

    it('adds additional textures as needed', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        // remove some textures
        var textureID = 'texture_Untitled';
        var texture = boxOverGroundGltfClone.textures[textureID];
        boxOverGroundGltfClone.textures = {};
        boxOverGroundGltfClone.textures[textureID] = texture;

        var materials = boxOverGroundGltfClone.materials;
        for (var materialID in materials) {
            if (materials.hasOwnProperty(materialID)) {
                materials[materialID].values.diffuse = textureID;
            }
        }

        var options = {
            numberRays: 0,
            resolution: 4,
            toTexture: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 images with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(3);
    });

    it('adds additional materials as needed', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        // remove some materials
        var materialID = 'Material-effect';
        var material = boxOverGroundGltfClone.materials[materialID];
        boxOverGroundGltfClone.materials = {};
        boxOverGroundGltfClone.materials[materialID] = material;

        var scene = boxOverGroundGltfClone.scenes[boxOverGroundGltfClone.scene];
        var primitiveFunction = function(primitive) {
            primitive.material = materialID;
        };

        NodeHelpers.forEachPrimitiveInScene(boxOverGroundGltfClone, scene, primitiveFunction, {});

        var options = {
            numberRays: 0,
            resolution: 4,
            toTexture: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(3); // 1 unused texture, 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(2);
    });

    it('can generate new images for materials that just have a diffuse color', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        // remove some textures
        var textureID = 'texture_Untitled';
        var materials = boxOverGroundGltfClone.materials;
        for (var materialID in materials) {
            if (materials.hasOwnProperty(materialID)) {
                if (materials[materialID].values.diffuse === textureID) {
                    materials[materialID].values.diffuse = [1.0, 1.0, 1.0, 1.0];
                }
            }
        }

        var options = {
            numberRays: 0,
            resolution: 4,
            toTexture: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 images with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(3); // 1 unused texture, 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(4); // 1 unused material, 2 with AO
    });

    it('adds a buffer, bufferView, and an accessor for each primitive when baking AO to vertices', function() {
        var boxOverGroundGltfClone = clone(boxOverGroundGltf);

        var options = {
            numberRays: 0,
            toVertex: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.accessors).length).toEqual(10);
        var cubeMeshPrimitives = boxOverGroundGltfClone.meshes.Cube_mesh.primitives;
        expect(cubeMeshPrimitives[0].attributes._OCCLUSION).toEqual('accessor_Cube_mesh_0_AO');

        expect(boxOverGroundGltfClone.buffers.aoBuffer).toBeDefined();
        expect(boxOverGroundGltfClone.bufferViews.aoBufferView).toBeDefined();
        expect(boxOverGroundGltfClone.bufferViews.aoBufferView.byteLength).toEqual(72 * 4);
    });

    it('clones the shading chain as needed for primitives that should not have AO', function() {
        var boxOverGroundGltfClone = clone(boxOverGroundGltf);

        var options = {
            numberRays: 0,
            toVertex: true
        };
        bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(4);
        expect(Object.keys(boxOverGroundGltfClone.techniques).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.programs).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.shaders).length).toEqual(4);

        var usedPrimitives = boxOverGroundGltfClone.meshes.Cube_mesh.primitives;
        expect(usedPrimitives[0].material).toEqual('Material-effect');

        var unusedPrimitives = boxOverGroundGltfClone.meshes.useless_mesh.primitives;
        expect(unusedPrimitives[0].material).toEqual('Material_001-effect_noAO');
        expect(unusedPrimitives[1].material).toEqual('Material_001-effect_noAO');
        expect(unusedPrimitives[2].material).toEqual('useless-material');
        expect(unusedPrimitives[3].material).toEqual('useless-material');
    });

    it('it can sample occlusion just at a triangle center', function() {
        var aoBuffer = {
            samples: new Array(3).fill(0.0),
            count: new Array(3).fill(CesiumMath.EPSILON10)
        };

        var parameters = {
            raytracerScene : {
                aoBufferByPrimitive : {
                    meshPrimitiveID : aoBuffer
                },
                bufferDataByAccessor : equilateralBufferDataByAccessor,
                triangleGrid : tetrahedronGrid,
                numberRays : 16,
                nearCull : CesiumMath.EPSILON4,
                rayDistance : 1.0
            }
        };

        var node = {
            extras : {
                _pipeline : {
                    flatTransform : Matrix4.IDENTITY
                }
            }
        };

        var primitive = {
            indices : 'indices',
            attributes : {
                POSITION : 'positions',
                NORMAL : 'normals'
            }
        };

        raytraceAtTriangleCenters(primitive, 'meshPrimitiveID', parameters, node);

        var samples = aoBuffer.samples;
        var counts = aoBuffer.count;

        // Expect the baked AO to indicate "fully occluded" since the center is inside the tetrahedron
        expect(CesiumMath.equalsEpsilon(samples[0], counts[0], CesiumMath.EPSILON7)).toEqual(true);
        expect(CesiumMath.equalsEpsilon(samples[1], counts[1], CesiumMath.EPSILON7)).toEqual(true);
        expect(CesiumMath.equalsEpsilon(samples[2], counts[2], CesiumMath.EPSILON7)).toEqual(true);
        expect(CesiumMath.equalsEpsilon(counts[0], 16.0, CesiumMath.EPSILON7)).toEqual(true);
        expect(CesiumMath.equalsEpsilon(counts[1], 16.0, CesiumMath.EPSILON7)).toEqual(true);
        expect(CesiumMath.equalsEpsilon(counts[2], 16.0, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('it can sample occlusion over the area of a triangle and average the results to the vertices', function() {
        var aoBuffer = {
            samples: new Array(3).fill(0.0),
            count: new Array(3).fill(CesiumMath.EPSILON10)
        };

        var parameters = {
            raytracerScene : {
                aoBufferByPrimitive : {
                    meshPrimitiveID : aoBuffer
                },
                bufferDataByAccessor : equilateralBufferDataByAccessor,
                triangleGrid : tetrahedronGrid,
                numberRays : 4,
                nearCull : CesiumMath.EPSILON4,
                rayDistance : 1.0
            },
            density : 4
        };

        var node = {
            extras : {
                _pipeline : {
                    flatTransform : Matrix4.IDENTITY
                }
            }
        };

        var primitive = {
            indices : 'indices',
            attributes : {
                POSITION : 'positions',
                NORMAL : 'normals'
            }
        };

        raytraceOverTriangleSamples(primitive, 'meshPrimitiveID', parameters, node);

        var samples = aoBuffer.samples;
        var counts = aoBuffer.count;

        // Expect the baked AO to only be partially occluded since there will be samples outside the tetrahedron
        expect(counts[0] > 4).toEqual(true);
        expect(counts[1] > 4).toEqual(true);
        expect(counts[2] > 4).toEqual(true);
        expect(CesiumMath.equalsEpsilon(samples[0], counts[0], CesiumMath.EPSILON7)).toEqual(false);
        expect(CesiumMath.equalsEpsilon(samples[1], counts[1], CesiumMath.EPSILON7)).toEqual(false);
        expect(CesiumMath.equalsEpsilon(samples[2], counts[2], CesiumMath.EPSILON7)).toEqual(false);
    });

    it('generates options given nothing but a gltf or just a quality setting', function() {
        var aoOptions = {};
        var options = generateOptions(boxOverGroundGltf, aoOptions);
        expect(options.toTexture).toEqual(false);
        expect(options.groundPlane).toEqual(false);
        expect(options.ambientShadowContribution).toEqual(0.5);
        expect(options.density).toEqual(1.0);
        expect(options.resolution).toEqual(128);
        expect(options.numberRays).toEqual(16);
        expect(options.triangleCenterOnly).toEqual(false);
        expect(options.rayDistance).toEqual(-1);
        expect(options.nearCull).toEqual(0.0001);
        expect(options.shaderMode).toEqual('blend');
        expect(options.sceneID).toEqual('defaultScene');

        aoOptions = {
            quality: 'medium'
        };
        options = generateOptions(boxOverGroundGltf, aoOptions);
        expect(options.toTexture).toEqual(false);
        expect(options.groundPlane).toEqual(false);
        expect(options.ambientShadowContribution).toEqual(0.5);
        expect(options.density).toEqual(2.0);
        expect(options.resolution).toEqual(256);
        expect(options.numberRays).toEqual(36);
        expect(options.triangleCenterOnly).toEqual(false);
        expect(options.rayDistance).toEqual(-1);
        expect(options.nearCull).toEqual(0.0001);
        expect(options.shaderMode).toEqual('blend');
        expect(options.sceneID).toEqual('defaultScene');

        aoOptions = {
            quality: 'high'
        };
        options = generateOptions(boxOverGroundGltf, aoOptions);
        expect(options.toTexture).toEqual(false);
        expect(options.groundPlane).toEqual(false);
        expect(options.ambientShadowContribution).toEqual(0.5);
        expect(options.density).toEqual(4.0);
        expect(options.resolution).toEqual(512);
        expect(options.numberRays).toEqual(64);
        expect(options.triangleCenterOnly).toEqual(false);
        expect(options.rayDistance).toEqual(-1);
        expect(options.nearCull).toEqual(0.0001);
        expect(options.shaderMode).toEqual('blend');
        expect(options.sceneID).toEqual('defaultScene');
    });

    it('overwrites parameters in base options when advanced settings are specified', function() {
        var aoOptions = {
            quality: 'medium',
            toTexture: true,
            triangleCenterOnly: true,
            rayDistance: 10.0
        };
        var options = generateOptions(boxOverGroundGltf, aoOptions);
        expect(options.toTexture).toEqual(true);
        expect(options.groundPlane).toEqual(false);
        expect(options.ambientShadowContribution).toEqual(0.5);
        expect(options.density).toEqual(2.0);
        expect(options.resolution).toEqual(256);
        expect(options.numberRays).toEqual(36);
        expect(options.triangleCenterOnly).toEqual(true);
        expect(options.rayDistance).toEqual(10.0);
        expect(options.nearCull).toEqual(0.0001);
        expect(options.shaderMode).toEqual('blend');
        expect(options.sceneID).toEqual('defaultScene');
    });

    it('has a helper that can extract a function call from a shader', function() {
        var shaderSource = 'function(arg0, arg1, arg2, arg3, innerArg0) {' +
            'command(arg3);' +
            'otherCommand(arg0);' +
            'val = command(arg0, arg1 * (arg2 + innerCommand(innerArg0))) + 0.0;' +
            '}';

        var shader = {
            extras : {
                _pipeline : {
                    source : shaderSource
                }
            }
        };
        var options = {
            shader : shader,
            functionName : 'command',
            functionArguments : ['arg0', 'arg1', 'arg2']
        };

        var extractedCommand = extractInstructionWithFunctionCall(options);
        expect(extractedCommand).toEqual('val = command(arg0, arg1 * (arg2 + innerCommand(innerArg0))) + 0.0');
    });

    it('has a helper that can, given a snippet, inject code into shader after an instruction', function() {
        var shaderSource = 'function(arg0, arg1, arg2, arg3, innerArg0) {' +
            'command(arg3);' +
            'otherCommand(arg0);' +
            'val = command(arg0, arg1 * (arg2 + innerCommand(innerArg0))) + 0.0;' +
            '}';

        var shader = {
            extras : {
                _pipeline : {
                    source : shaderSource
                }
            }
        };
        var options = {
            shader : shader,
            lines : ['newCommand1();', 'newCommand2();'],
            snippet : 'innerCommand'
        };

        injectGlslAfterInstructionContaining(options);
        var newSource = shader.extras._pipeline.source;
        expect(newSource).toEqual('function(arg0, arg1, arg2, arg3, innerArg0) {' +
            'command(arg3);' +
            'otherCommand(arg0);' +
            'val = command(arg0, arg1 * (arg2 + innerCommand(innerArg0))) + 0.0;' +
            'newCommand1();' +
            'newCommand2();' +
            '}');
    });
});
