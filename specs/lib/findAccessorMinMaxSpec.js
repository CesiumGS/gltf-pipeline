'use strict';
var findAccessorMinMax = require('../../lib/findAccessorMinMax');
var readResources = require('../../lib/readResources');

var contiguousData = [
    -1.0, -2.0, -3.0,
    3.0, 2.0, 1.0,
    0.0, 0.0, 0.0,
    0.5, -0.5, 0.5
];

var nan = Number.NaN;
var nonContiguousData = [
    -1.0, 1.0, -1.0,
    nan, nan, nan,
    0.0, 0.0, 0.0,
    nan, nan, nan,
    3.0, 2.0, 1.0,
    nan, nan, nan,
    -1.0, -2.0, -3.0,
    nan, nan, nan
];

function createGltf(elements, byteStride) {
    var buffer = Buffer.from((new Float32Array(elements)).buffer);
    var byteLength = buffer.length;
    var dataUri = 'data:application/octet-stream;base64,' + buffer.toString('base64');
    var gltf =  {
        asset : {
            version : '2.0'
        },
        accessors : [
            {
                bufferView : 0,
                byteOffset : 0,
                componentType : 5126,
                count : 4,
                type : 'VEC3'
            }
        ],
        bufferViews : [
            {
                buffer : 0,
                byteOffset : 0,
                byteLength : byteLength,
                byteStride : byteStride
            }
        ],
        buffers : [
            {
                uri : dataUri,
                byteLength : byteLength
            }
        ]
    };
    return readResources(gltf);
}

// TODO : test more component types
describe('findAccessorMinMax', function() {
    it('finds the min and max of an accessor', function(done) {
        expect(createGltf(contiguousData, 12)
            .then(function(gltf) {
                var expectedMin = [-1.0, -2.0, -3.0];
                var expectedMax = [3.0, 2.0, 1.0];
                var minMax = findAccessorMinMax(gltf, gltf.accessors[0]);
                expect(minMax.min).toEqual(expectedMin);
                expect(minMax.max).toEqual(expectedMax);
            }), done).toResolve();
    });

    it('finds the min and max in a non-contiguous accessor', function(done) {
        expect(createGltf(nonContiguousData, 24)
            .then(function(gltf) {
                var expectedMin = [-1.0, -2.0, -3.0];
                var expectedMax = [3.0, 2.0, 1.0];
                var minMax = findAccessorMinMax(gltf, gltf.accessors[0]);
                expect(minMax.min).toEqual(expectedMin);
                expect(minMax.max).toEqual(expectedMax);
            }), done).toResolve();
    });
});
