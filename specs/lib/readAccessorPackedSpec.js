'use strict';
var Cesium = require('cesium');
var readAccessorPacked = require('../../lib/readAccessorPacked');
var readResources = require('../../lib/readResources');

var arrayFill = Cesium.arrayFill;

var contiguousData = [
    -1.0, 1.0, -1.0,
    0.0, 0.0, 0.0,
    3.0, 2.0, 1.0,
    -1.0, -2.0, -3.0
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
        accessors: [
            {
                bufferView: 0,
                byteOffset: 0,
                componentType: 5126,
                count: 4,
                type: 'VEC3'
            }
        ],
        bufferViews: [
            {
                buffer: 0,
                byteOffset: 0,
                byteLength: byteLength,
                byteStride: byteStride
            }
        ],
        buffers: [
            {
                uri: dataUri,
                byteLength: byteLength
            }
        ]
    };
    return readResources(gltf);
}

describe('readAccessorPacked', function() {
    it('reads contiguous accessor', function(done) {
        expect(createGltf(contiguousData, 12)
            .then(function(gltf) {
                expect(readAccessorPacked(gltf, gltf.accessors[0])).toEqual(contiguousData);
            }), done).toResolve();
    });

    it('reads non-contiguous accessor', function(done) {
        expect(createGltf(nonContiguousData, 24)
            .then(function(gltf) {
                expect(readAccessorPacked(gltf, gltf.accessors[0])).toEqual(contiguousData);
            }), done).toResolve();
    });

    it('reads accessor that does not have a buffer view', function() {
        var gltf =  {
            accessors: [
                {
                    componentType: 5126,
                    count: 4,
                    type: 'VEC3'
                }
            ]
        };
        var expected = arrayFill(new Array(12), 0); // All zeroes
        expect(readAccessorPacked(gltf, gltf.accessors[0])).toEqual(expected);
    });
});
