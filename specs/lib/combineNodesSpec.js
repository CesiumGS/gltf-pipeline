'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var combineNodes = require('../../lib/combineNodes');
var readAccessor = require('../../lib/readAccessor');

describe('combineNodes', function() {
    it('reduces a scene with extra nodes to a single node', function() {
        var gltf = {
            nodes : {
                nodeA : {},
                nodeB : {},
                nodeC : {}
            },
            scenes : {
                scene : {
                    nodes : [
                        'nodeA',
                        'nodeB',
                        'nodeC'
                    ]
                }
            }
        };
        combineNodes(gltf);
        expect(Object.keys(gltf.nodes).length).toEqual(1);
    });

    it('preserves camera node', function() {
        var gltf = {
            nodes : {
                nodeA : {
                    children : ['nodeB']
                },
                nodeB : {
                    children : ['nodeC']
                },
                nodeC : {
                    camera : 'camera'
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.nodeC).toBeDefined();
    });

    it('preserve joint node', function() {
        var gltf = {
            nodes : {
                nodeA : {
                    children : ['nodeB']
                },
                nodeB : {
                    children : ['nodeC']
                },
                nodeC : {
                    jointName : 'joint'
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.nodeC).toBeDefined();
    });

    it('handles crossed mesh dependencies', function() {
        var gltf = {
            meshes : {
                mesh : {}
            },
            nodes : {
                nodeA : {
                    meshes : ['mesh']
                },
                nodeB : {
                    meshes : ['mesh']
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA', 'nodeB']
                }
            }
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.nodeA).toBeDefined();
        expect(nodes.nodeB).toBeDefined();
    });

    it('flattens out unnecessary node chains', function() {
        var gltf = {
            nodes : {
                nodeA : {
                    children : ['nodeB'],
                    matrix : [
                        1.0, 0.0, 0.0, 0.0,
                        0.0, 2.0, 0.0, 0.0,
                        0.0, 0.0, 3.0, 0.0,
                        1.0, 2.0, 3.0, 1.0
                    ]
                },
                nodeB : {
                    children : ['nodeC'],
                    matrix : [
                        4.0, 0.0, 0.0, 0.0,
                        0.0, 5.0, 0.0, 0.0,
                        0.0, 0.0, 6.0, 0.0,
                        4.0, 5.0, 6.0, 1.0
                    ]
                },
                nodeC : {
                    camera : ''
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        var cameraNode = nodes.nodeC;
        expect(cameraNode).toBeDefined();
        expect(cameraNode.matrix).toEqual([
            4.0,  0.0,  0.0, 0.0,
            0.0, 10.0,  0.0, 0.0,
            0.0,  0.0, 18.0, 0.0,
            5.0, 12.0, 21.0, 1.0
        ]);
    });

    it('doesn\'t modify nodes targeted for animation', function() {
        var gltf = {
            animations : {
                animation : {
                    channels : [
                        {
                            target: {
                                id: 'nodeA'
                            }
                        }
                    ]
                }
            },
            nodes : {
                nodeA : {}
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        expect(gltf.nodes.nodeA).toBeDefined();
    });

    it('doesn\'t modify nodes targeted from technique parameters', function() {
        var gltf = {
            nodes : {
                nodeA : {}
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            },
            techniques : {
                technique : {
                    parameters : {
                        lightTransform : {
                            node : 'nodeA'
                        }
                    }
                }
            }
        };
        combineNodes(gltf);
        expect(gltf.nodes.nodeA).toBeDefined();
    });

    it('transforms mesh primitives from a child node and passes it to the parent', function() {
        var positions = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var normals = new Float32Array([1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0]);
        var indices = new Uint16Array([0, 1, 2, 2, 1, 0]);
        var positionsBuffer = Buffer.from(positions.buffer);
        var normalsBuffer = Buffer.from(normals.buffer);
        var attributesBuffer = Buffer.concat([positionsBuffer, normalsBuffer]);
        var indicesBuffer = Buffer.from(indices.buffer);
        var buffer = Buffer.concat([attributesBuffer, indicesBuffer]);
        var gltf = {
            accessors : {
                positionAccessor : {
                    bufferView : 'attributesBufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : positions.length / 3,
                    type : "VEC3"
                },
                normalAccessor : {
                    bufferView : 'attributesBufferView',
                    byteOffset : normalsBuffer.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : normals.length / 3,
                    type : "VEC3"
                },
                indicesAccessor : {
                    bufferView : 'indicesBufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indices.length,
                    type : "SCALAR"
                }
            },
            bufferViews : {
                attributesBufferView : {
                    buffer : 'buffer',
                    byteLength : attributesBuffer.length,
                    byteOffset : 0,
                    target : WebGLConstants.ARRAY_BUFFER
                },
                indicesBufferView : {
                    buffer : 'buffer',
                    byteLength : indicesBuffer.length,
                    byteOffset : attributesBuffer.length,
                    target : WebGLConstants.ELEMENT_ARRAY_BUFFER
                }
            },
            buffers : {
                buffer : {
                    type : "arraybuffer",
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 'normalAccessor',
                                POSITION : 'positionAccessor'
                            },
                            indices : 'indicesAccessor'
                        }
                    ]
                }
            },
            nodes : {
                nodeA : {
                    children : ['nodeB']
                },
                nodeB : {
                    meshes : ['mesh'],
                    matrix : [1.0, 0.0, 0.0, 0.0,
                              0.0, 1.0, 0.0, 0.0,
                              0.0, 0.0, 1.0, 0.0,
                              1.0, 2.0, 3.0, 1.0]
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        var accessors = gltf.accessors;
        var nodes = gltf.nodes;
        var rootNodeId = Object.keys(nodes)[0];
        var rootNode = nodes[rootNodeId];
        expect(rootNode.meshes[0]).toEqual('mesh');

        var cartesianPositions = [];
        var cartesianNormals = [];
        readAccessor(gltf, accessors.positionAccessor, cartesianPositions);
        readAccessor(gltf, accessors.normalAccessor, cartesianNormals);
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
        var positionsBuffer = Buffer.from(positions.buffer);
        var normalsBuffer = Buffer.from(normals.buffer);
        var attributesBuffer = Buffer.concat([positionsBuffer, normalsBuffer]);
        var indicesBuffer = Buffer.from(indices.buffer);
        var overlappedIndicesBuffer = Buffer.from(overlappedIndices.buffer);
        var allIndicesBuffer = Buffer.concat([indicesBuffer, overlappedIndicesBuffer]);
        var buffer = Buffer.concat([attributesBuffer, allIndicesBuffer]);
        var gltf = {
            accessors : {
                positionAccessor : {
                    bufferView : 'attributesBufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : positions.length / 3,
                    type : "VEC3"
                },
                normalAccessor : {
                    bufferView : 'attributesBufferView',
                    byteOffset : normalsBuffer.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : normals.length / 3,
                    type : "VEC3"
                },
                indicesAccessor : {
                    bufferView : 'indicesBufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indices.length,
                    type : "SCALAR"
                },
                overlappedIndicesAccessor : {
                    bufferView : 'indicesBufferView',
                    byteOffset : indicesBuffer.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : overlappedIndices.length,
                    type : "SCALAR"
                }
            },
            bufferViews : {
                attributesBufferView : {
                    buffer : 'buffer',
                    byteLength : attributesBuffer.length,
                    byteOffset : 0,
                    target : WebGLConstants.ARRAY_BUFFER
                },
                indicesBufferView : {
                    buffer : 'buffer',
                    byteLength : allIndicesBuffer.length,
                    byteOffset : attributesBuffer.length,
                    target : WebGLConstants.ELEMENT_ARRAY_BUFFER
                }
            },
            buffers : {
                buffer : {
                    type : "arraybuffer",
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                meshA : {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 'normalAccessor',
                                POSITION : 'positionAccessor'
                            },
                            indices : 'indicesAccessor'
                        }
                    ]
                },
                meshB : {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 'normalAccessor',
                                POSITION : 'positionAccessor'
                            },
                            indices : 'overlappedIndicesAccessor'
                        }
                    ]
                }
            },
            nodes : {
                nodeA : {
                    children : ['nodeB', 'nodeC']
                },
                nodeB : {
                    meshes : ['meshA'],
                    matrix : [1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        1.0, 2.0, 3.0, 1.0]
                },
                nodeC: {
                    meshes : ['meshB']
                }
            },
            scenes : {
                scene : {
                    nodes : ['nodeA']
                }
            }
        };
        combineNodes(gltf);
        var nodes = gltf.nodes;
        expect(nodes.nodeB).toBeDefined();
        expect(nodes.nodeC).toBeDefined();
    });
});