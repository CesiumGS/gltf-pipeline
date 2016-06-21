'use strict';
var Cesium = require('cesium');
var CesiumMath = Cesium.Math;
var Cartesian3 = Cesium.Cartesian3;
var bakeAmbientOcclusion = require('../../lib/bakeAmbientOcclusion');
var clone = require('clone');
var NodeHelpers = require('../../lib/NodeHelpers');
var readGltf = require('../../lib/readGltf');

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

describe('bakeAmbientOcclusion', function() {
    var boxOverGroundGltf;

    var indices = [0,1,2,0,2,3];
    var indicesBuffer = new Buffer(indices.length * 2);
    for (var i = 0; i < indices.length; i++) {
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
    var positionsBuffer = new Buffer(positions.length * 4);
    for (i = 0; i < positions.length; i++) {
        positionsBuffer.writeFloatLE(positions[i], i * 4);
    }
    var normalsBuffer = new Buffer(normals.length * 4);
    for (i = 0; i < normals.length; i++) {
        normalsBuffer.writeFloatLE(normals[i], i * 4);
    }
    var uvsBuffer = new Buffer(uvs.length * 4);
    for (i = 0; i < uvs.length; i++) {
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
                "byteLength": indices.length * 2 + (positions.length + normals.length + uvs.length) * 4,
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
        var options = {
            imageProcess: true
        };
        readGltf(boxOverGroundGltfPath, options, function(gltf) {
            boxOverGroundGltf = gltf;
            done();
        });
    });

    // tetrahedron
    var point0 = new Cartesian3(0.0, -1.0, 1.0);
    var point1 = new Cartesian3(1.0, -1.0, -1.0);
    var point2 = new Cartesian3(-1.0, -1.0, -1.0);
    var point3 = new Cartesian3(0.0, 1.0, 0.0);

    var tetrahedron = [
        {positions: [point0, point1, point2]},
        {positions: [point0, point1, point3]},
        {positions: [point1, point2, point3]},
        {positions: [point2, point0, point3]}
    ];

    it('correctly processes a basic 2-triangle square primitive', function() {
        var scene = testGltf.scenes[testGltf.scene];
        var options = {
            rayDepth : 0.1,
            resolution : 10
        };
        var raytracerScene = bakeAmbientOcclusion.generateRaytracerScene(testGltf, scene, options);
        var triangleSoup = raytracerScene.triangleSoup;

        // because of the uniform scale, expect triangles to be bigger
        var point0 = new Cartesian3(0.0, 0.0, 0.0);
        var point1 = new Cartesian3(0.0, 2.0, 0.0);
        var point2 = new Cartesian3(2.0, 2.0, 0.0);
        var point3 = new Cartesian3(2.0, 0.0, 0.0);
        var normal = new Cartesian3(0.0, 0.0, 1.0);

        ////////// check triangle soup //////////
        expect(triangleSoup.length).toEqual(2);

        var triangle0 = triangleSoup[0];
        var triangle1 = triangleSoup[1];

        expect(Cartesian3.equalsEpsilon(triangle0.positions[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle0.positions[1], point1, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle0.positions[2], point2, CesiumMath.EPSILON7)).toEqual(true);

        expect(Cartesian3.equalsEpsilon(triangle1.positions[0], point0, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle1.positions[1], point2, CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(triangle1.positions[2], point3, CesiumMath.EPSILON7)).toEqual(true);

        // check ao buffers
        var aoBuffersByPrimitive = raytracerScene.aoBufferByPrimitive;
        var aoBuffer = aoBuffersByPrimitive.mesh_square_0;
        expect(aoBuffer).toBeDefined();
        expect(aoBuffer.resolution).toEqual(10);
    });

    it('generates all occluded (1.0) for samples inside a closed tetrahedron', function() {
        var normals = [];
        for (var i = 0; i < 6; i++) {
            var values = [0.0, 0.0, 0.0];
            values[i % 3] = (i % 2) ? 1.0 : -1.0;
            var newNormal = new Cartesian3(values[0], values[1], values[2]);
            normals.push(newNormal);
        }

        var aoBuffer = {
            resolution: 3,
            samples: new Array(9).fill(0.0),
            count: new Array(9).fill(0.0)
        };

        var texelPoints = [];

        for (i = 0; i < 6; i++) {
            texelPoints.push({
                position: Cartesian3.ZERO,
                normal: normals[i],
                index: i,
                buffer: aoBuffer
            });
        }

        for (i = 0; i < 6; i++) {
            var texel = texelPoints[i];
            bakeAmbientOcclusion.computeAmbientOcclusionAt(
                texel.position, texel.normal, 16, 4,
                tetrahedron, 0.001, 10.0, aoBuffer, texel.index);
        }

        var samples = aoBuffer.samples;
        var counts = aoBuffer.count;
        for (i = 0; i < 6; i++) {
            expect(samples[i]).toEqual(16.0);
            expect(counts[i]).toEqual(16);
        }
    });

    it('generates various levels of occlusion for samples in the mouth of an open tetrahedron', function() {
        var openTetrahedron = [tetrahedron[1], tetrahedron[2], tetrahedron[3]];

        var aoBuffer = {
            resolution: 2,
            samples: new Array(4).fill(0.0),
            count: new Array(4).fill(0.0)
        };

        var bottomCenter = new Cartesian3(0.0, -1.0, 0.0);

        var texelPoints = [
            {
                position: bottomCenter,
                normal: new Cartesian3(0.0, 1.0, 0.0),
                index: 0,
                buffer: aoBuffer
            },
            {
                position: bottomCenter,
                normal: new Cartesian3(0.0, -1.0, 0.0),
                index: 1,
                buffer: aoBuffer
            },
            {
                position: bottomCenter,
                normal: new Cartesian3(1.0, 0.0, 0.0),
                index: 2,
                buffer: aoBuffer
            }
        ];

        for (var i = 0; i < 3; i++) {
            var texel = texelPoints[i];
            bakeAmbientOcclusion.computeAmbientOcclusionAt(
                texel.position, texel.normal, 16, 4,
                openTetrahedron, 0.001, 10.0, aoBuffer, texel.index);
        }

        var samples = aoBuffer.samples;

        expect(samples[0]).toEqual(16);
        expect(samples[1]).toEqual(0); // randomized, but stratification should ensure this.
        expect(samples[2] > 6 && samples[2] < 10).toEqual(true); // randomized, but stratification should ensure this.
    });

    it('modifies existing images, textures, and materials in place', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        var options = {
            numberSamples: 1,
            rayDepth: 1.0,
            resolution: 4
        };
        bakeAmbientOcclusion.bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(2);
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
            runAO: true,
            numberSamples: 1,
            rayDepth: 1.0,
            resolution: 4
        };
        bakeAmbientOcclusion.bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(2);
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
            runAO: true,
            numberSamples: 1,
            rayDepth: 1.0,
            resolution: 4
        };
        bakeAmbientOcclusion.bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 images with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(2);
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(2);
    });

    it ('adds additional materials as needed', function() {
        var boxOverGroundGltfClone = cloneGltfWithJimps(boxOverGroundGltf);

        // remove some materials
        var materialID = 'Material-effect';
        var material = boxOverGroundGltfClone.materials[materialID];
        boxOverGroundGltfClone.materials = {};
        boxOverGroundGltfClone.materials[materialID] = material;

        var meshes = boxOverGroundGltfClone.meshes;

        var scene = boxOverGroundGltfClone.scenes[boxOverGroundGltfClone.scene];
        var primitiveFunction = function(primitive) {
            primitive.material = materialID;
        };

        NodeHelpers.forEachPrimitiveInScene(boxOverGroundGltfClone, scene, primitiveFunction);

        var options = {
            runAO: true,
            numberSamples: 1,
            rayDepth: 1.0,
            resolution: 4
        };
        bakeAmbientOcclusion.bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(3); // 1 unused texture, 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(2);
    });

    it ('can generate new images for materials that just have a diffuse color', function() {
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
            runAO: true,
            numberSamples: 1,
            rayDepth: 1.0,
            resolution: 4
        };
        bakeAmbientOcclusion.bakeAmbientOcclusion(boxOverGroundGltfClone, options);

        expect(Object.keys(boxOverGroundGltfClone.images).length).toEqual(3); // 1 unused image and 2 images with AO
        expect(Object.keys(boxOverGroundGltfClone.textures).length).toEqual(3); // 1 unused texture, 2 with AO
        expect(Object.keys(boxOverGroundGltfClone.materials).length).toEqual(3); // 1 unused material, 2 with AO
    });
});
