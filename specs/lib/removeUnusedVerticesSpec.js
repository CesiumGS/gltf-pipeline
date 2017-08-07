'use strict';
var clone = require('clone');
var AccessorReader = require('../../lib/AccessorReader');
var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var removeUnusedVertices = require('../../lib/removeUnusedVertices');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

describe('removeUnusedVertices', function() {
    var indices = new Uint16Array([0, 1, 2]);
    var indicesOneUnused = new Uint16Array([0, 2]);
    var indicesTwoUnused = new Uint16Array([1]);
    var attributeOne = new Buffer(new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8]).buffer);
    var attributeTwo = new Buffer(new Uint16Array([0, 1, 2, 3, 4, 5]).buffer);
    var attributeThree = new Buffer(new Uint16Array([9, 10, 11, 12, 13, 14, 15, 16, 17]).buffer);
    var attributesBuffer = Buffer.concat([attributeOne, attributeTwo, attributeThree]);

    var testGltf = {
        accessors : [
            {
                byteOffset : 0,
                bufferView : 0,
                componentType : 5123,
                type : 'SCALAR'
            },
            {
                bufferView : 1,
                componentType : 5126,
                count : 3,
                byteOffset : 0,
                type : 'VEC3'
            },
            {
                bufferView : 1,
                componentType : 5123,
                count : 3,
                byteOffset : attributeOne.length,
                type : 'VEC2'
            },
            {
                bufferView : 1,
                componentType : 5123,
                count : 3,
                byteOffset : 0,
                type : 'VEC3'
            }
        ],
        buffers : [
            {
                extras : {
                    _pipeline : {}
                }
            },
            {
                byteLength : attributesBuffer.length,
                extras : {
                    _pipeline : {
                        source : attributesBuffer
                    }
                }
            }
        ],
        bufferViews : [
            {
                buffer : 0,
                byteOffset : 0,
                target : 34963
            },
            {
                buffer : 1,
                byteOffset : 0,
                byteLength : attributesBuffer.length,
                target : 34962
            }
        ],
        meshes : [
            {
                primitives : [
                    {
                        attributes : {
                            POSITION : 1,
                            NORMAL : 2
                        },
                        indices : 0
                    }
                ]
            }
        ]
    };

    it('does not remove any data if all attribute values are accessed', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers[0];
        var indexBuffer = new Buffer(indices.buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews[0].byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors[0];
        indexAccessor.count = indices.length;
        var byteLength = attributesBuffer.byteLength;
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(attributesBuffer.byteLength).toEqual(byteLength);
    });

    it('removes one unused attribute', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers[0];
        var indexBuffer = new Buffer(indicesOneUnused.slice(0).buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews[0].byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors[0];
        indexAccessor.count = indicesOneUnused.length;
        var attributesBuffer = gltf.buffers[1];
        var byteLength = attributesBuffer.byteLength;
        var attributeAccessor1 = gltf.accessors[1];
        var expectBytesDropped1 = numberOfComponentsForType(attributeAccessor1.type) * byteLengthForComponentType(attributeAccessor1.componentType);
        var attributeAccessor2 = gltf.accessors[2];
        var expectBytesDropped2 = numberOfComponentsForType(attributeAccessor2.type) * byteLengthForComponentType(attributeAccessor2.componentType);
        var expectBytesDropped = expectBytesDropped1 + expectBytesDropped2;
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[1].byteLength + expectBytesDropped).toEqual(byteLength);

        var expectAttribute1 = [[0, 1, 2], [6, 7, 8]];
        var reader = new AccessorReader(gltf, attributeAccessor1);
        var components = [];
        var i = 0;
        while(!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectAttribute1[i]);
            reader.next();
            i++;
        }
        var expectAttribute2 = [[0, 1], [4, 5]];
        reader = new AccessorReader(gltf, attributeAccessor2);
        components = [];
        i = 0;
        while(!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectAttribute2[i]);
            reader.next();
            i++;
        }
        var expectIndices = [[0], [1]];
        reader = new AccessorReader(gltf, indexAccessor);
        components = [];
        i = 0;
        while(!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectIndices[i]);
            reader.next();
            i++;
        }
    });

    it('removes two unused attributes', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers[0];
        var indexBuffer = new Buffer(indicesTwoUnused.slice(0).buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews[0].byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors[0];
        indexAccessor.count = indicesTwoUnused.length;
        var attributesBuffer = gltf.buffers[1];
        var byteLength = attributesBuffer.byteLength;
        var attributeAccessor1 = gltf.accessors[1];
        var expectBytesDropped1 = numberOfComponentsForType(attributeAccessor1.type) * byteLengthForComponentType(attributeAccessor1.componentType);
        var attributeAccessor2 = gltf.accessors[2];
        var expectBytesDropped2 = numberOfComponentsForType(attributeAccessor2.type) * byteLengthForComponentType(attributeAccessor2.componentType);
        var expectBytesDropped = 2 * (expectBytesDropped1 + expectBytesDropped2);
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[1].byteLength + expectBytesDropped).toEqual(byteLength);

        var expectAttribute1 = [[3, 4, 5]];
        var reader = new AccessorReader(gltf, attributeAccessor1);
        var components = [];
        var i = 0;
        while (!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectAttribute1[i]);
            reader.next();
            i++;
        }
        var expectAttribute2 = [[2, 3]];
        reader = new AccessorReader(gltf, attributeAccessor2);
        components = [];
        i = 0;
        while (!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectAttribute2[i]);
            reader.next();
            i++;
        }
        var expectIndices = [[0]];
        reader = new AccessorReader(gltf, indexAccessor);
        components = [];
        i = 0;
        while (!reader.pastEnd()) {
            reader.read(components);
            expect(components).toEqual(expectIndices[i]);
            reader.next();
            i++;
        }
    });

    it('handles when primitives use the same accessors with different indices', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers[0];
        var indexBuffer = new Buffer(indicesTwoUnused.slice(0).buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        var indexBufferView = gltf.bufferViews[0];
        indexBufferView.byteLength = indexBuffer.length;

        var gltfIndexBuffer2 = clone(gltfIndexBuffer);
        var indexBuffer2 = new Buffer(indicesOneUnused.slice(0).buffer);
        gltfIndexBuffer2.extras._pipeline.source = indexBuffer2;
        gltfIndexBuffer2.byteLength = indexBuffer2.length;
        gltf.buffers.push(gltfIndexBuffer2);

        var gltfIndexBufferView2 = clone(indexBufferView);
        gltfIndexBufferView2.buffer = 2;
        gltfIndexBufferView2.byteLength = indexBuffer2.length;
        gltf.bufferViews.push(gltfIndexBufferView2);

        var gltfIndexAccessor = gltf.accessors[0];
        gltfIndexAccessor.count = indicesTwoUnused.length;
        var gltfIndexAccessor2 = clone(gltfIndexAccessor);
        gltfIndexAccessor2.count = indicesOneUnused.length;
        gltfIndexAccessor2.bufferView = 2;
        gltf.accessors.push(gltfIndexAccessor2);

        var mesh2 = clone(gltf.meshes[0]);
        mesh2.primitives[0].indices = 4;
        gltf.meshes.push(mesh2);

        // All indices are used, 0 and 2 by the first primitive and 1 by the other
        var attributesBuffer = gltf.buffers[1];
        var byteLength = attributesBuffer.byteLength;
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(attributesBuffer.byteLength).toEqual(byteLength);
    });

    it('handles when primitives use the same accessors along with different accessors with different indices', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers[0];
        var indexBuffer = new Buffer(indicesTwoUnused.slice(0).buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        var indexBufferView = gltf.bufferViews[0];
        indexBufferView.byteLength = indexBuffer.length;

        var gltfIndexBuffer2 = clone(gltfIndexBuffer);
        var indexBuffer2 = new Buffer(indicesOneUnused.slice(0).buffer);
        gltfIndexBuffer2.extras._pipeline.source = indexBuffer2;
        gltfIndexBuffer2.byteLength = indexBuffer2.length;
        gltf.buffers.push(gltfIndexBuffer2);

        var gltfIndexBufferView2 = clone(indexBufferView);
        gltfIndexBufferView2.buffer = 2;
        gltfIndexBufferView2.byteLength = indexBuffer2.length;
        gltf.bufferViews.push(gltfIndexBufferView2);

        var gltfIndexAccessor = gltf.accessors[0];
        gltfIndexAccessor.count = indicesTwoUnused.length;
        var gltfIndexAccessor2 = clone(gltfIndexAccessor);
        gltfIndexAccessor2.count = indicesOneUnused.length;
        gltfIndexAccessor2.bufferView = 2;
        gltf.accessors.push(gltfIndexAccessor2);

        var mesh2 = clone(gltf.meshes[0]);
        var primitive = mesh2.primitives[0];
        primitive.attributes.POSITION = 3;
        primitive.indices = 4;
        gltf.meshes.push(mesh2);

        // All indices are used, 0 and 2 by the first primitive and 1 by the other
        var attributesBuffer = gltf.buffers[1];
        var byteLength = attributesBuffer.byteLength;
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(attributesBuffer.byteLength).toEqual(byteLength);
    });

    it('handles when there is a cross-dependency between two groups of primitives', function() {
        var attributeData1 = new Float32Array([0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0]);
        var attributeDataBuffer1 = new Buffer(attributeData1.buffer);
        var attributeData2 = new Float32Array([15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0]);
        var attributeDataBuffer2 = new Buffer(attributeData2.buffer);
        var indexData1 = new Uint16Array([0, 1, 2, 4, 2, 1, 0, 1, 2]);
        var indexDataBuffer1 = new Buffer(indexData1.buffer);
        var indexData2 = new Uint16Array([0, 1, 3, 4, 3, 1, 0]);
        var indexDataBuffer2 = new Buffer(indexData2.buffer);
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
                    count : 9,
                    type : 'SCALAR'
                }, {
                    bufferView : 3,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 7,
                    type : 'SCALAR'
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteOffset : 0,
                    byteLength : attributeDataBuffer1.length,
                    target : 34962
                }, {
                    buffer : 1,
                    byteOffset : 0,
                    byteLength : attributeDataBuffer2.length,
                    target : 34962
                }, {
                    buffer : 2,
                    byteOffset : 0,
                    byteLength : indexDataBuffer1.length,
                    target : 34963
                }, {
                    buffer : 3,
                    byteOffset : 0,
                    byteLength : indexDataBuffer2.length,
                    target : 34963
                }
            ],
            buffers : [
                {
                    byteLength : attributeDataBuffer1.length,
                    extras : {
                        _pipeline : {
                            source : attributeDataBuffer1.slice(0)
                        }
                    }
                }, {
                    byteLength : attributeDataBuffer2.length,
                    extras : {
                        _pipeline : {
                            source : attributeDataBuffer2.slice(0)
                        }
                    }
                }, {
                    byteLength : indexDataBuffer1.length,
                    extras : {
                        _pipeline : {
                            source : indexDataBuffer1.slice(0)
                        }
                    }
                }, {
                    byteLength : indexDataBuffer2.length,
                    extras : {
                        _pipeline : {
                            source : indexDataBuffer2.slice(0)
                        }
                    }
                }
            ],
            meshes : [
                {
                    primitives: [
                        {
                            attributes : {
                                TEST : 0
                            },
                            indices : 2
                        }, {
                            attributes : {
                                TEST : 1
                            },
                            indices : 3
                        }, {
                            attributes : {
                                TEST : 0
                            },
                            indices : 3
                        }
                    ]
                }
            ]
        };
        removeUnusedVertices(gltf);
        uninterleaveAndPackBuffers(gltf);
        var buffers = gltf.buffers;
        expect(buffers[0].extras._pipeline.source).toEqual(attributeDataBuffer1);
        expect(buffers[1].extras._pipeline.source).toEqual(attributeDataBuffer2);
        expect(buffers[2].extras._pipeline.source).toEqual(indexDataBuffer1);
        expect(buffers[3].extras._pipeline.source).toEqual(indexDataBuffer2);
    });

    it('removes parts of the buffer based on the attribute type if the stride is 0', function() {
        var i;
        var indices = [0,1,2,0,2,3];
        var indicesBuffer = new Buffer(indices.length * 2);
        for (i = 0; i < indices.length; i++) {
            indicesBuffer.writeUInt16LE(indices[i], i * 2);
        }

        var positions = [
            0,0,0,
            0,1,0,
            1,1,0,
            1,0,0,
            2,2,2,
            2,2,2,
            2,2,2
        ];
        var positionsBuffer = new Buffer(positions.length * 4);
        for (i = 0; i < positions.length; i++) {
            positionsBuffer.writeFloatLE(positions[i], i * 4);
        }

        var dataBuffer = Buffer.concat([indicesBuffer, positionsBuffer]);

        var testGltf = {
            accessors : [
                {
                    bufferView : 1,
                    byteOffset : 0,
                    componentType : 5123,
                    count : 6,
                    type : 'SCALAR',
                    extras : {
                        _pipeline: {}
                    }
                }, {
                    bufferView : 0,
                    byteOffset : 0,
                    componentType : 5126,
                    count : 4,
                    type : 'VEC3',
                    extras : {
                        _pipeline : {}
                    }
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteOffset : 6 * 2,
                    byteLength : 7 * 3 * 4,
                    target : 34962,
                    extras : {
                        _pipeline : {}
                    }
                }, {
                    buffer : 0,
                    byteOffset : 0,
                    byteLength : 6 * 2,
                    target : 34963,
                    extras : {
                        _pipeline : {}
                    }
                }
            ],
            buffers : [
                {
                    byteLength : indices.length * 2 + positions.length * 4,
                    extras : {
                        _pipeline : {
                            source : dataBuffer
                        }
                    }
                }
            ],
            meshes : [
                {
                    name : 'square',
                    primitives : [
                        {
                            attributes : {
                                POSITION : 1
                            },
                            indices : 0
                        }
                    ]
                }
            ]
        };
        removeUnusedVertices(testGltf);
        uninterleaveAndPackBuffers(testGltf);
        expect(testGltf.buffers[0].byteLength).toEqual(6 * 2 + 4 * 3 * 4);
    });

    it('handles 8 bit indices', function(){
        var i;
        var indices = [0,1,2,0,2,3];
        var indicesBuffer = new Buffer(indices.length);
        for (i = 0; i < indices.length; i++) {
            indicesBuffer.writeUInt8(indices[i], i);
        }

        var positions = [
            0,0,0,
            0,1,0,
            1,1,0,
            1,0,0,
            2,2,2,
            2,2,2,
            2,2,2
        ];
        var positionsBuffer = new Buffer(positions.length * 4);
        for (i = 0; i < positions.length; i++) {
            positionsBuffer.writeFloatLE(positions[i], i * 4);
        }

        var dataBuffer = Buffer.concat([indicesBuffer, positionsBuffer]);

        var testGltf = {
            accessors: [
                {
                    bufferView : 1,
                    byteOffset: 0,
                    componentType: 5121, // unsigned short
                    count: 6,
                    type: 'SCALAR',
                    extras: {
                        _pipeline: {}
                    }
                }, {
                    bufferView: 0,
                    byteOffset: 0,
                    componentType: 5126,
                    count: 4,
                    type: 'VEC3',
                    extras: {
                        _pipeline: {}
                    }
                }
            ],
            bufferViews: [
                {
                    buffer: 0,
                    byteOffset: 6,
                    byteLength: 7 * 3 * 4,
                    target: 34962,
                    extras: {
                        _pipeline: {}
                    }
                },
                {
                    buffer: 0,
                    byteOffset: 0,
                    byteLength: 6,
                    target: 34963,
                    extras: {
                        _pipeline: {}
                    }
                }
            ],
            buffers: [
                {
                    byteLength: indices.length + positions.length * 4,
                    extras: {
                        _pipeline: {
                            source: dataBuffer
                        }
                    }
                }
            ],
            meshes: [
                {
                    name: 'square',
                    primitives: [
                        {
                            attributes: {
                                POSITION: 1
                            },
                            indices: 0
                        }
                    ]
                }
            ]
        };
        removeUnusedVertices(testGltf);
        uninterleaveAndPackBuffers(testGltf);
        expect(testGltf.buffers[0].byteLength).toEqual(6 + 4 * 3 * 4);
    });
});