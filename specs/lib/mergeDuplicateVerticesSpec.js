'use strict';

var mergeDuplicateVertices = require('../../lib/mergeDuplicateVertices');

describe('mergeDuplicateVertices', function() {
    it('merges duplicate vertices', function() {
        var A = new Buffer(new Float32Array([0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 0.0, 1.0, 2.0]).buffer);
        var B = new Buffer(new Uint16Array([6, 7, 8, 9, 6, 7, 6, 7, 6, 7]).buffer);
        var C = new Buffer(new Uint16Array([0, 1, 2, 3, 4, 3, 2, 1, 0]).buffer);
        var gltf = {
            accessors : {
                accessorA : {
                    bufferView : 'bufferViewA',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : 5126,
                    count : 5,
                    type : 'VEC3'
                },
                accessorB : {
                    bufferView : 'bufferViewB',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : 5123,
                    count : 5,
                    type : 'VEC2'
                },
                accessorC : {
                   bufferView : 'bufferViewC',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : 5123,
                    count : 9,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferViewA : {
                    buffer : 'bufferA',
                    byteOffset : 0,
                    byteLength : A.length
                },
                bufferViewB : {
                    buffer : 'bufferB',
                    byteOffset : 0,
                    byteLength : B.length
                },
                bufferViewC : {
                    buffer : 'bufferC',
                    byteOffset : 0,
                    byteLength : C.length
                }
            },
            buffers : {
                bufferA : {
                    byteLength : A.length,
                    extras : {
                        _pipeline : {
                            source : A
                        }
                    }
                },
                bufferB : {
                    byteLength : B.length,
                    extras : {
                        _pipeline : {
                            source : B
                        }
                    }
                },
                bufferC : {
                    byteLength : C.length,
                    extras : {
                        _pipeline : {
                            source : C
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [
                        {
                            attributes : {
                                A : 'accessorA',
                                B : 'accessorB'
                            },
                            indices : 'accessorC'
                        }
                    ]
                }
            }
        };
        mergeDuplicateVertices(gltf);
        var indices = new Uint16Array(gltf.buffers.bufferC.extras._pipeline.source.buffer);
        expect(indices).toEqual(new Uint16Array([0, 1, 0, 3, 0, 3, 0, 1, 0]));
    });
});