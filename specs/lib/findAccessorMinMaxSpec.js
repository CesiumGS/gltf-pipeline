'use strict';
var clone = require('clone');
var findAccessorMinMax = require('../../lib/findAccessorMinMax');

var testGltf = {
    accessors : {
        accessor : {
            bufferView : 'bufferView',
            byteOffset : 0,
            componentType : 5126,
            count : 4,
            type : 'VEC3'
        }
    },
    bufferViews : {
        bufferView : {
            buffer : 'buffer',
            byteOffset : 0
        }
    },
    buffers : {
        buffer : {
            extras: {
                _pipeline: {}
            }
        }
    }
};

describe('findAccessorMinMax', function() {
    it('finds the min and max of an accessor', function() {
        var gltf = clone(testGltf);
        var expectMin = [-1.0, -2.0, -3.0];
        var expectMax = [3.0, 2.0, 1.0];
        var bufferData = new Float32Array(
            [-1.0, -2.0, -3.0,
                3.0, 2.0, 1.0,
                0.0, 0.0, 0.0,
                0.5, -0.5, 0.5
            ]);
        var source = new Buffer(bufferData.buffer);
        var gltfBuffer = gltf.buffers.buffer;
        gltfBuffer.extras._pipeline.source = source;
        gltfBuffer.byteLength = source.length;
        var gltfBufferView = gltf.bufferViews.bufferView;
        gltfBufferView.byteLength = source.length;
        var gltfAccessor = gltf.accessors.accessor;

        var minMax = findAccessorMinMax(gltf, gltfAccessor);
        expect(minMax.min).toEqual(expectMin);
        expect(minMax.max).toEqual(expectMax);
    });

    it('finds the min and max in a non-contiguous accessor', function() {
        var gltf = clone(testGltf);
        var nan = Number.NaN;
        var expectMin = [-1.0, -2.0, -3.0];
        var expectMax = [3.0, 2.0, 1.0];
        var bufferData = new Float32Array(
            [-1.0, 1.0, -1.0,
                nan, nan, nan,
                0.0, 0.0, 0.0,
                nan, nan, nan,
                3.0, 2.0, 1.0,
                nan, nan, nan,
                -1.0, -2.0, -3.0,
                nan, nan, nan
            ]);
        var source = new Buffer(bufferData.buffer);
        var gltfBuffer = gltf.buffers.buffer;
        gltfBuffer.extras._pipeline.source = source;
        gltfBuffer.byteLength = source.length;
        var gltfBufferView = gltf.bufferViews.bufferView;
        gltfBufferView.byteLength = source.length;
        var gltfAccessor = gltf.accessors.accessor;
        gltfBufferView.byteStride = 24;

        var minMax = findAccessorMinMax(gltf, gltfAccessor);
        expect(minMax.min).toEqual(expectMin);
        expect(minMax.max).toEqual(expectMax);
    });
});