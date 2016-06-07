'use strict';
var clone = require('clone');

var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var packBuffers = require('../../lib/packBuffers');

describe('packBuffers', function() {
    var buffer = new Uint8Array(96);
    var testGltf = {
        accessors : {
            // Interleaved accessors in bufferView_0
            accessor_0 : {
                bufferView : 'bufferView_0',
                byteOffset : 0,
                byteStride : 18,
                componentType : 5126,
                count : 3,
                type : 'VEC3'
            },
            accessor_1 : {
                bufferView : 'bufferView_0',
                byteOffset : 12,
                byteStride : 18,
                componentType : 5123,
                count : 3,
                type : 'VEC2'
            },
            // Block accessors in bufferView_1
            accessor_2 : {
                bufferView : 'bufferView_1',
                byteOffset : 0,
                byteStride : 12,
                componentType : 5126,
                count : 3,
                type : 'VEC3'
            },
            accessor_3 : {
                bufferView : 'bufferView_1',
                byteOffset : 36,
                componentType : 5123,
                count : 3,
                type : 'VEC2'
            }
        },
        bufferViews : {
            bufferView_0 : {
                buffer : 'buffer',
                byteLength : 48,
                byteOffset : 0,
                target : 34962
            },
            bufferView_1 : {
                buffer : 'buffer',
                byteLength : 48,
                byteOffset : 48,
                target : 34963
            }
        },
        buffers : {
            buffer : {
                byteLength : buffer.length,
                type : 'arraybuffer',
                extras : {
                    _pipeline : {}
                }
            }
        }
    };

    it('doesn\'t remove any data if the whole buffer is used', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        packBuffers(gltf);
        expect(gltf.buffers.buffer.byteLength).toEqual(testGltf.buffers.buffer.byteLength);
    });

    it('removes extra trailing data on the buffer', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = new Uint8Array(buffer.length * 2);
        packBuffers(gltf);
        expect(gltf.buffers.buffer.byteLength).toEqual(testGltf.buffers.buffer.byteLength);
    });

    it('removes interleaved unused data', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        var deletedAccessorId = 'accessor_1';
        var deletedAccessor = gltf.accessors[deletedAccessorId];
        var size = byteLengthForComponentType(deletedAccessor.componentType) * numberOfComponentsForType(deletedAccessor.type) * deletedAccessor.count;
        delete gltf.accessors[deletedAccessorId];
        packBuffers(gltf);
        expect(gltf.buffers.buffer.byteLength + size).toEqual(testGltf.buffers.buffer.byteLength);
    });

    it('removes block unused data', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        var deletedAccessorId = 'accessor_2';
        var deletedAccessor = gltf.accessors[deletedAccessorId];
        var size = byteLengthForComponentType(deletedAccessor.componentType) * numberOfComponentsForType(deletedAccessor.type) * deletedAccessor.count;
        delete gltf.accessors[deletedAccessorId];
        packBuffers(gltf);
        expect(gltf.buffers.buffer.byteLength + size).toEqual(testGltf.buffers.buffer.byteLength);
    });

    it('removes unused bufferView', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        var size = gltf.bufferViews.bufferView_0.byteLength;
        delete gltf.accessors.accessor_0;
        delete gltf.accessors.accessor_1;
        packBuffers(gltf);
        expect(gltf.buffers.buffer.byteLength + size).toEqual(testGltf.buffers.buffer.byteLength);
        var bufferViewCount = Object.keys(gltf.bufferViews).length;
        expect(bufferViewCount).toEqual(1);
    });
});