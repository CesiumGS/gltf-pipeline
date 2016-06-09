'use strict';
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var loadGltfUris = require('../../lib/loadGltfUris');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var removeUnusedVertices = require('../../lib/removeUnusedVertices');
var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');


describe('removeUnusedVertices', function() {
    var indices = new Uint16Array([0, 1, 2]);
    var indicesOneUnused = new Uint16Array([0, 2]);
    var indicesTwoUnused = new Uint16Array([1]);
    var attributeOne = new Buffer(new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8]).buffer);
    var attributeTwo = new Buffer(new Uint16Array([0, 1, 2, 3, 4, 5]).buffer);
    var attributesBuffer = Buffer.concat([attributeOne, attributeTwo]);

    var testGltf = {
        accessors : {
            indexAccessor : {
                byteOffset : 0,
                byteStride : 0,
                bufferView : 'indexBufferView',
                componentType : 5123,
                type : 'SCALAR'
            },
            attributeAccessor1 : {
                byteStride : 0,
                bufferView : 'attributesBufferView',
                componentType : 5126,
                count : 3,
                byteOffset : 0,
                type : 'VEC3'
            },
            attributeAccessor2 : {
                byteStride : 0,
                bufferView : 'attributesBufferView',
                componentType : 5123,
                count : 3,
                byteOffset : attributeOne.length,
                type : 'VEC2'
            }
        },
        buffers : {
            indexBuffer : {
                type : 'arraybuffer',
                extras : {
                    _pipeline : {}
                }
            },
            attributesBuffer : {
                byteLength : attributesBuffer.length,
                type : 'arraybuffer',
                extras : {
                    _pipeline : {
                        source : attributesBuffer
                    }
                }
            }
        },
        bufferViews : {
            indexBufferView : {
                buffer : 'indexBuffer',
                byteOffset : 0,
                target : 34963
            },
            attributesBufferView : {
                buffer : 'attributesBuffer',
                byteOffset : 0,
                byteLength : attributesBuffer.length,
                target : 34962
            }
        },
        meshes : {
            mesh : {
                primitives : [
                    {
                        attributes : {
                            POSITION : 'attributeAccessor1',
                            NORMAL : 'attributeAccessor2'
                        },
                        indices : 'indexAccessor'
                    }
                ]
            }
        }
    };

    it('does not remove any data if all attribute values are accessed', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers.indexBuffer;
        var indexBuffer = new Buffer(indices.buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews.indexBufferView.byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors.indexAccessor;
        indexAccessor.count = indices.length;
        var attributesBuffer = gltf.buffers.attributesBuffer;
        var byteLength = attributesBuffer.byteLength;
        removeUnusedVertices(gltf);
        expect(attributesBuffer.byteLength).toEqual(byteLength);
    });

    it('removes one unused attribute', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers.indexBuffer;
        var indexBuffer = new Buffer(indicesOneUnused.buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews.indexBufferView.byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors.indexAccessor;
        indexAccessor.count = indicesOneUnused.length;
        var attributesBuffer = gltf.buffers.attributesBuffer;
        var byteLength = attributesBuffer.byteLength;
        var attributeAccessor1 = gltf.accessors.attributeAccessor1;
        var expectBytesDropped1 = numberOfComponentsForType(attributeAccessor1.type) * byteLengthForComponentType(attributeAccessor1.componentType);
        var attributeAccessor2 = gltf.accessors.attributeAccessor2;
        var expectBytesDropped2 = numberOfComponentsForType(attributeAccessor2.type) * byteLengthForComponentType(attributeAccessor2.componentType);
        var expectBytesDropped = expectBytesDropped1 + expectBytesDropped2;
        removeUnusedVertices(gltf);
        expect(attributesBuffer.byteLength + expectBytesDropped).toEqual(byteLength);

        var expectAttribute1 = [0, 1, 2, 6, 7, 8];
        var expectAttribute2 = [0, 1, 4, 5];
        var attributesSource = Uint8Array.from(attributesBuffer.extras._pipeline.source);
        var check1 = new Float32Array(attributesSource.buffer, attributeAccessor1.byteOffset, expectAttribute1.length);
        var check2 = new Uint16Array(attributesSource.buffer, attributeAccessor2.byteOffset, expectAttribute2.length);
        var i;
        for (i = 0; i < expectAttribute1.length; i++) {
            expect(expectAttribute1[i]).toEqual(check1[i]);
        }
        for (i = 0; i < expectAttribute2.length; i++) {
            expect(expectAttribute2[i]).toEqual(check2[i]);
        }

        var expectIndices = [0, 1];
        var indicesSource = Uint8Array.from(gltf.buffers.indexBuffer.extras._pipeline.source);
        var check = new Uint16Array(indicesSource.buffer, 0, expectIndices.length);
        for (i = 0; i < expectIndices.length; i++) {
            expect(expectIndices[i]).toEqual(check[i]);
        }
    });

    it ('removes two unused attributes', function() {
        var gltf = clone(testGltf);
        var gltfIndexBuffer = gltf.buffers.indexBuffer;
        var indexBuffer = new Buffer(indicesTwoUnused.buffer);
        gltfIndexBuffer.extras._pipeline.source = indexBuffer;
        gltfIndexBuffer.byteLength = indexBuffer.length;
        gltf.bufferViews.indexBufferView.byteLength = indexBuffer.length;
        var indexAccessor = gltf.accessors.indexAccessor;
        indexAccessor.count = indicesTwoUnused.length;
        var attributesBuffer = gltf.buffers.attributesBuffer;
        var byteLength = attributesBuffer.byteLength;
        var attributeAccessor1 = gltf.accessors.attributeAccessor1;
        var expectBytesDropped1 = numberOfComponentsForType(attributeAccessor1.type) * byteLengthForComponentType(attributeAccessor1.componentType);
        var attributeAccessor2 = gltf.accessors.attributeAccessor2;
        var expectBytesDropped2 = numberOfComponentsForType(attributeAccessor2.type) * byteLengthForComponentType(attributeAccessor2.componentType);
        var expectBytesDropped = 2 * (expectBytesDropped1 + expectBytesDropped2);
        removeUnusedVertices(gltf);
        expect(attributesBuffer.byteLength + expectBytesDropped).toEqual(byteLength);

        var expectAttribute1 = [3, 4, 5];
        var expectAttribute2 = [2, 3];
        var attributesSource = Uint8Array.from(attributesBuffer.extras._pipeline.source);
        var check1 = new Float32Array(attributesSource.buffer, attributeAccessor1.byteOffset, expectAttribute1.length);
        var check2 = new Uint16Array(attributesSource.buffer, attributeAccessor2.byteOffset, expectAttribute2.length);
        var i;
        for (i = 0; i < expectAttribute1.length; i++) {
            expect(expectAttribute1[i]).toEqual(check1[i]);
        }
        for (i = 0; i < expectAttribute2.length; i++) {
            expect(expectAttribute2[i]).toEqual(check2[i]);
        }

        var expectIndices = [0];
        var indicesSource = Uint8Array.from(gltf.buffers.indexBuffer.extras._pipeline.source);
        var check = new Uint16Array(indicesSource.buffer, 0, expectIndices.length);
        for (i = 0; i < expectIndices.length; i++) {
            expect(expectIndices[i]).toEqual(check[i]);
        }
    });
});