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
        var source = new Uint8Array(gltf.buffers.bufferC.extras._pipeline.source);
        var indices = new Uint16Array(source.buffer);
        // 3 and 4 are unused
        expect(indices).toEqual(new Uint16Array([0, 1, 0, 2, 0, 2, 0, 1, 0]));
        expect(gltf.buffers.bufferA.byteLength).toEqual(A.length - 24);
        expect(gltf.buffers.bufferB.byteLength).toEqual(B.length - 8);
    });

    it('merges duplicate vertices with repeated index accessors', function() {
        var A = new Buffer(new Float32Array([0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 0.0, 1.0, 2.0]).buffer);
        var A2 = new Buffer(new Float32Array([4.0, 5.0, 6.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 4.0, 5.0, 6.0, 4.0, 5.0, 6.0]).buffer);
        var B = new Buffer(new Uint16Array([6, 7, 8, 9, 6, 7, 6, 7, 6, 7]).buffer);
        var B2 = new Buffer(new Uint16Array([10, 11, 12, 13, 10, 11, 10, 11, 10, 11]).buffer);
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
                accessorA2 : {
                    bufferView : 'bufferViewA2',
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
                accessorB2 : {
                    bufferView : 'bufferViewB2',
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
                bufferViewA2 : {
                    buffer : 'bufferA2',
                    byteOffset : 0,
                    byteLength : A2.length
                },
                bufferViewB : {
                    buffer : 'bufferB',
                    byteOffset : 0,
                    byteLength : B.length
                },
                bufferViewB2 : {
                    buffer : 'bufferB2',
                    byteOffset : 0,
                    byteLength : B2.length
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
                bufferA2 : {
                    byteLength : A2.length,
                    extras : {
                        _pipeline : {
                            source : A2
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
                bufferB2 : {
                    byteLength : B2.length,
                    extras : {
                        _pipeline : {
                            source : B2
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
                        },
                        {
                            attributes : {
                                A : 'accessorA2',
                                B : 'accessorB2'
                            },
                            indices : 'accessorC'
                        }
                    ]
                }
            }
        };
        mergeDuplicateVertices(gltf);
        var source = new Uint8Array(gltf.buffers.bufferC.extras._pipeline.source);
        var indices = new Uint16Array(source.buffer);
        // Only 4 is unused across the two primitives
        expect(indices).toEqual(new Uint16Array([0, 1, 2, 3, 0, 3, 2, 1, 0]));
        expect(gltf.buffers.bufferA.byteLength).toEqual(A.length - 12);
        expect(gltf.buffers.bufferB.byteLength).toEqual(B.length - 4);
    });
});