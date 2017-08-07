'use strict';
var AccessorReader = require('../../lib/AccessorReader');
var mergeDuplicateVertices = require('../../lib/mergeDuplicateVertices');
var removeUnusedVertices = require('../../lib/removeUnusedVertices');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

describe('mergeDuplicateVertices', function() {
    it('merges duplicate vertices', function() {
        var A = new Buffer(new Float32Array([0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 0.0, 1.0, 2.0]).buffer);
        var B = new Buffer(new Uint16Array([6, 7, 8, 9, 6, 7, 6, 7, 6, 7]).buffer);
        var C = new Buffer(new Uint16Array([0, 1, 2, 3, 4, 3, 2, 1, 0]).buffer);
        var gltf = {
            accessors : [
                {
                    bufferView : 0,
                    byteOffset : 0,
                    componentType : 5126,
                    count : 5,
                    type : 'VEC3'
                }, {
                    bufferView : 1,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 5,
                    type : 'VEC2'
                }, {
                    bufferView : 2,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 9,
                    type : 'SCALAR'
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteOffset : 0,
                    byteLength : A.length
                }, {
                    buffer : 1,
                    byteOffset : 0,
                    byteLength : B.length
                }, {
                    buffer : 2,
                    byteOffset : 0,
                    byteLength : C.length
                }
            ],
            buffers : [
                {
                    byteLength : A.length,
                    extras : {
                        _pipeline : {
                            source : A
                        }
                    }
                }, {
                    byteLength : B.length,
                    extras : {
                        _pipeline : {
                            source : B
                        }
                    }
                }, {
                    byteLength : C.length,
                    extras : {
                        _pipeline : {
                            source : C
                        }
                    }
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                A : 0,
                                B : 1,
                            },
                            indices : 2
                        }
                    ]
                }
            ]
        };
        mergeDuplicateVertices(gltf);
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        var reader = new AccessorReader(gltf, gltf.accessors[2]);
        var component = [];
        var expectIndices = [0, 1, 0, 2, 0, 2, 0, 1, 0];
        var i = 0;
        while (!reader.pastEnd()) {
            reader.read(component);
            expect(component[0]).toEqual(expectIndices[i]);
            reader.next();
            i++;
        }
        expect(gltf.buffers[0].byteLength).toEqual(A.length - 24);
        expect(gltf.buffers[1].byteLength).toEqual(B.length - 8);
    });

    it('merges duplicate vertices with repeated index accessors', function() {
        var A = new Buffer(new Float32Array([0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 0.0, 1.0, 2.0]).buffer);
        var A2 = new Buffer(new Float32Array([4.0, 5.0, 6.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 4.0, 5.0, 6.0, 4.0, 5.0, 6.0]).buffer);
        var B = new Buffer(new Uint16Array([6, 7, 8, 9, 6, 7, 6, 7, 6, 7]).buffer);
        var B2 = new Buffer(new Uint16Array([10, 11, 12, 13, 10, 11, 10, 11, 10, 11]).buffer);
        var C = new Buffer(new Uint16Array([0, 1, 2, 3, 4, 3, 2, 1, 0]).buffer);
        var gltf = {
            accessors : [
                {
                    bufferView : 0,
                    byteOffset : 0,
                    componentType : 5126,
                    count : 5,
                    type : 'VEC3'
                }, {
                    bufferView : 1,
                    byteOffset : 0,
                    componentType : 5126,
                    count : 5,
                    type : 'VEC3'
                }, {
                    bufferView : 2,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 5,
                    type : 'VEC2'
                }, {
                    bufferView : 3,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 5,
                    type : 'VEC2'
                }, {
                    bufferView : 4,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 9,
                    type : 'SCALAR'
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteOffset : 0,
                    byteLength : A.length
                }, {
                    buffer : 1,
                    byteOffset : 0,
                    byteLength : A2.length
                }, {
                    buffer : 2,
                    byteOffset : 0,
                    byteLength : B.length
                }, {
                    buffer : 3,
                    byteOffset : 0,
                    byteLength : B2.length
                }, {
                    buffer : 4,
                    byteOffset : 0,
                    byteLength : C.length
                }
            ],
            buffers : [
                {
                    byteLength : A.length,
                    extras : {
                        _pipeline : {
                            source : A
                        }
                    }
                }, {
                    byteLength : A2.length,
                    extras : {
                        _pipeline : {
                            source : A2
                        }
                    }
                }, {
                    byteLength : B.length,
                    extras : {
                        _pipeline : {
                            source : B
                        }
                    }
                }, {
                    byteLength : B2.length,
                    extras : {
                        _pipeline : {
                            source : B2
                        }
                    }
                }, {
                    byteLength : C.length,
                    extras : {
                        _pipeline : {
                            source : C
                        }
                    }
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                A : 0,
                                B : 2
                            },
                            indices : 4
                        },
                        {
                            attributes : {
                                A : 1,
                                B : 3
                            },
                            indices : 4
                        }
                    ]
                }
            ]
        };
        mergeDuplicateVertices(gltf);
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        // Only 4 is unused across the two primitives
        var reader = new AccessorReader(gltf, gltf.accessors[4]);
        var component = [];
        var expectIndices = [0, 1, 2, 3, 0, 3, 2, 1, 0];
        var i = 0;
        while (!reader.pastEnd()) {
            reader.read(component);
            expect(component[0]).toEqual(expectIndices[i]);
            reader.next();
            i++;
        }
        expect(gltf.buffers[0].byteLength).toEqual(A.length - 12);
        expect(gltf.buffers[2].byteLength).toEqual(B.length - 4);
    });
});