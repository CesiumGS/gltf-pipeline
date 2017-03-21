'use strict';
var clone = require('clone');
var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var Remove = require('../../lib/Remove');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

describe('uninterleaveAndPackBuffers', function() {
    var buffer = new Buffer(96);
    var testGltf = {
        accessors : [
            // Interleaved accessors in bufferView_0
            {
                bufferView : 0,
                byteOffset : 0,
                componentType : 5126,
                count : 3,
                type : 'VEC3'
            },
            {
                bufferView : 0,
                byteOffset : 12,
                componentType : 5123,
                count : 3,
                type : 'VEC2'
            },
            // Block accessors in bufferView_1
            {
                bufferView : 1,
                byteOffset : 0,
                byteStride : 12,
                componentType : 5126,
                count : 3,
                type : 'VEC3'
            },
            {
                bufferView : 1,
                byteOffset : 36,
                componentType : 5123,
                count : 3,
                type : 'VEC2'
            }
        ],
        bufferViews : [
            {
                buffer : 0,
                byteLength : 48,
                byteOffset : 0,
                byteStride: 18,
                target : 34962
            },
            {
                buffer : 0,
                byteLength : 48,
                byteOffset : 48,
                target : 34963
            }
        ],
        buffers : [
            {
                byteLength : buffer.length,
                extras : {
                    _pipeline : {
                        source: buffer
                    }
                }
            }
        ]
    };

    it('doesn\'t remove any data if the whole buffer is used', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(testGltf.buffers[0].byteLength);
    });

    it('removes extra trailing data on the buffer', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = new Buffer(buffer.length * 2);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(testGltf.buffers[0].byteLength);
    });

    it('removes interleaved unused data', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        var deletedAccessor = gltf.accessors[1];
        var size = byteLengthForComponentType(deletedAccessor.componentType) * numberOfComponentsForType(deletedAccessor.type) * deletedAccessor.count;
        Remove.accessor(gltf, 1);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(testGltf.buffers[0].byteLength);
    });

    it('removes block unused data', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        var deletedAccessor = gltf.accessors[2];
        var size = byteLengthForComponentType(deletedAccessor.componentType) * numberOfComponentsForType(deletedAccessor.type) * deletedAccessor.count;
        Remove.accessor(gltf, 2);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(testGltf.buffers[0].byteLength);
        var bufferView = gltf.bufferViews[1];
        expect(bufferView.byteLength).toEqual(gltf.buffers[0].byteLength - bufferView.byteOffset);
    });

    it('removes unused bufferView', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        var size = gltf.bufferViews[0].byteLength;
        Remove.accessor(gltf, 0);
        Remove.accessor(gltf, 0);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(testGltf.buffers[0].byteLength);
        expect(gltf.bufferViews.length).toEqual(1);
    });
});