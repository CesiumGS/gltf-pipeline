'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var combineNodes = require('../../lib/combineNodes');
var readAccessor = require('../../lib/readAccessor');

describe('combineNodes', function() {
    it('reduces a scene with extra nodes to a single node', function() {
        var gltf = {
            nodes : [
                {},
                {},
                {}
            ],
            scenes : [
                {
                    nodes : [
                        0,
                        1,
                        2
                    ]
                }
            ]
        };
        combineNodes(gltf);
        expect(gltf.nodes.length).toEqual(1);
    });

    it('preserves camera node', function() {
        var gltf = {
            nodes : [
                {
                    children : [1]
                },
                {
                    children : [2]
                },
                {
                    camera : 0
                }
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(1);
        expect(nodes[0].camera).toBeDefined();
    });

    it('preserves joint node', function() {
        var gltf = {
            nodes : [
                {
                    children : [1]
                },
                {
                    children : [2]
                },
                {
                    jointName : 'joint'
                }
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(1);
        expect(nodes[0].jointName).toEqual('joint');
    });

    it('handles crossed mesh dependencies', function() {
        var gltf = {
            meshes : [
                {
                    primitives: [{}]
                }
            ],
            nodes : [
                {
                    mesh: 0
                },
                {
                    mesh: 0
                }
            ],
            scenes : [
                {
                    nodes : [0, 1]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(2);
        expect(nodes[0].mesh).toEqual(0);
        expect(nodes[1].mesh).toEqual(0);
    });

    it('flattens out unnecessary node chains', function() {
        var gltf = {
            nodes : [
                {
                    children : [1],
                    matrix : [
                        1.0, 0.0, 0.0, 0.0,
                        0.0, 2.0, 0.0, 0.0,
                        0.0, 0.0, 3.0, 0.0,
                        1.0, 2.0, 3.0, 1.0
                    ]
                },
                {
                    children : [2],
                    matrix : [
                        4.0, 0.0, 0.0, 0.0,
                        0.0, 5.0, 0.0, 0.0,
                        0.0, 0.0, 6.0, 0.0,
                        4.0, 5.0, 6.0, 1.0
                    ]
                },
                {
                    camera : 0
                }
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(1);
        var cameraNode = nodes[0];
        expect(cameraNode.camera).toEqual(0);
        expect(cameraNode.matrix).toEqual([
            4.0,  0.0,  0.0, 0.0,
            0.0, 10.0,  0.0, 0.0,
            0.0,  0.0, 18.0, 0.0,
            5.0, 12.0, 21.0, 1.0
        ]);
    });

    it('doesn\'t modify nodes targeted for animation', function() {
        var gltf = {
            animations : [
                {
                    channels : [
                        {
                            target: {
                                id: 0
                            }
                        }
                    ]
                }
            ],
            nodes : [
                {}
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(1);
    });

    it('doesn\'t modify nodes targeted from technique parameters', function() {
        var gltf = {
            nodes : [
                {}
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ],
            techniques : [
                {
                    parameters : {
                        lightTransform : {
                            node : 0
                        }
                    }
                }
            ]
        };
        combineNodes(gltf);
        expect(gltf.nodes.length).toEqual(1);
    });

    it('transforms mesh primitives from a child node and passes it to the parent', function() {
        var positions = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var normals = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var indices = new Uint16Array([0, 1, 2, 2, 1, 0]);
        var positionsBuffer = new Buffer(positions.buffer);
        var normalsBuffer = new Buffer(normals.buffer);
        var attributesBuffer = Buffer.concat([positionsBuffer, normalsBuffer]);
        var indicesBuffer = new Buffer(indices.buffer);
        var buffer = Buffer.concat([attributesBuffer, indicesBuffer]);
        var gltf = {
            accessors : [
                {
                    bufferView : 0,
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : positions.length / 3,
                    type : "VEC3"
                },
                {
                    bufferView : 0,
                    byteOffset : normalsBuffer.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : normals.length / 3,
                    type : "VEC3"
                },
                {
                    bufferView : 1,
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indices.length,
                    type : "SCALAR"
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : attributesBuffer.length,
                    byteOffset : 0,
                    target : WebGLConstants.ARRAY_BUFFER
                },
                {
                    buffer : 0,
                    byteLength : indicesBuffer.length,
                    byteOffset : attributesBuffer.length,
                    target : WebGLConstants.ELEMENT_ARRAY_BUFFER
                }
            ],
            buffers : [
                {
                    type : "arraybuffer",
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 1,
                                POSITION : 0
                            },
                            indices : 2
                        }
                    ]
                }
            ],
            nodes : [
                {
                    children : [1]
                },
                {
                    mesh : 0,
                    matrix : [1.0, 0.0, 0.0, 0.0,
                              0.0, 1.0, 0.0, 0.0,
                              0.0, 0.0, 1.0, 0.0,
                              1.0, 2.0, 3.0, 1.0]
                }
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var accessors = gltf.accessors;
        var nodes = gltf.nodes;
        var rootNodeId = gltf.scenes[0].nodes[0];
        var rootNode = nodes[rootNodeId];
        expect(rootNode.mesh).toEqual(0);

        var cartesianPositions = [];
        var cartesianNormals = [];
        readAccessor(gltf, accessors[0], cartesianPositions);
        readAccessor(gltf, accessors[1], cartesianNormals);
        expect(cartesianPositions.length).toEqual(cartesianNormals.length);

        var length = cartesianPositions.length;
        for (var i = 0; i < length; i++) {
            var position = cartesianPositions[i];
            var normal = cartesianNormals[i];
            expect(position.x).toEqual(positions[i*3] + 1.0);
            expect(position.y).toEqual(positions[i*3 + 1] + 2.0);
            expect(position.z).toEqual(positions[i*3 + 2] + 3.0);

            expect(normal.x).toEqual(normals[i*3]);
            expect(normal.y).toEqual(normals[i*3 + 1]);
            expect(normal.z).toEqual(normals[i*3 + 2]);
        }
    });

    it('separate nodes containing meshes with overlapping primitives are treated as immutable', function() {
        var positions = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var normals = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var indices = new Uint16Array([0, 1]);
        var overlappedIndices = new Uint16Array([1, 2]);
        var positionsBuffer = new Buffer(positions.buffer);
        var normalsBuffer = new Buffer(normals.buffer);
        var attributesBuffer = Buffer.concat([positionsBuffer, normalsBuffer]);
        var indicesBuffer = new Buffer(indices.buffer);
        var overlappedIndicesBuffer = new Buffer(overlappedIndices.buffer);
        var allIndicesBuffer = Buffer.concat([indicesBuffer, overlappedIndicesBuffer]);
        var buffer = Buffer.concat([attributesBuffer, allIndicesBuffer]);
        var gltf = {
            accessors : [
                {
                    bufferView : 0,
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : positions.length / 3,
                    type : "VEC3"
                },
                {
                    bufferView : 0,
                    byteOffset : normalsBuffer.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : normals.length / 3,
                    type : "VEC3"
                },
                {
                    bufferView : 1,
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indices.length,
                    type : "SCALAR"
                },
                {
                    bufferView: 1,
                    byteOffset: indicesBuffer.length,
                    byteStride: 0,
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    count: overlappedIndices.length,
                    type: "SCALAR"
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : attributesBuffer.length,
                    byteOffset : 0,
                    target : WebGLConstants.ARRAY_BUFFER
                },
                {
                    buffer : 0,
                    byteLength : allIndicesBuffer.length,
                    byteOffset : attributesBuffer.length,
                    target : WebGLConstants.ELEMENT_ARRAY_BUFFER
                }
            ],
            buffers : [
                {
                    type : "arraybuffer",
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 1,
                                POSITION : 0
                            },
                            indices : 2
                        }
                    ]
                },
                {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 1,
                                POSITION : 0
                            },
                            indices : 3
                        }
                    ]
                }
            ],
            nodes : [
                {
                    children : [1, 2],
                    name : 'NodeA'
                },
                {
                    mesh : 0,
                    matrix : [1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        1.0, 2.0, 3.0, 1.0],
                    name : 'NodeB'
                },
                {
                    mesh : 1,
                    name : 'NodeC'
                }
            ],
            scenes : [
                {
                    nodes : [0]
                }
            ]
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.length).toEqual(2);
        expect(nodes[0].name).toEqual('NodeB');
        expect(nodes[1].name).toEqual('NodeC');
    });
});