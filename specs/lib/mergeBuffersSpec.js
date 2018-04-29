'use strict';
var mergeBuffers = require('../../lib/mergeBuffers');
var readResources = require('../../lib/readResources');

describe('mergeBuffers', function() {
    it('merges buffers', function(done) {
        var nan = Number.NaN;
        var buffer0 = Buffer.from((new Uint8Array([1, 1, 1, 2, 2, nan, 3, 3, 3])));
        var buffer1 = Buffer.from((new Uint8Array([4, 4, 4, 4, 4, nan, nan, nan, nan, nan])));
        var dataUri0 = 'data:application/octet-stream;base64,' + buffer0.toString('base64');
        var dataUri1 = 'data:application/octet-stream;base64,' + buffer1.toString('base64');

        // All buffer views start on 4-byte alignment, the buffer ends on a 4-byte alignment, and extraneous buffer data is removed
        var expectedBuffer = Buffer.from((new Uint8Array([1, 1, 1, 0, 2, 2, 0, 0, 3, 3, 3, 0, 4, 4, 4, 4, 4, 0, 0, 0])));

        var gltf = {
            bufferViews: [
                {
                    buffer: 0,
                    byteOffset: 0,
                    byteLength: 3
                },
                {
                    buffer: 0,
                    byteOffset: 3,
                    byteLength: 2
                },
                {
                    buffer: 0,
                    byteOffset: 6,
                    byteLength: 3
                },
                {
                    buffer: 1,
                    byteOffset: 0,
                    byteLength: 5
                }
            ],
            buffers: [
                {
                    byteLength: buffer0.length,
                    uri: dataUri0
                },
                {
                    byteLength: buffer1.length,
                    uri: dataUri1
                }
            ]
        };

        expect(readResources(gltf)
            .then(function(gltf) {
                mergeBuffers(gltf);
                expect(gltf.buffers.length).toBe(1);
                expect(gltf.buffers[0].extras._pipeline.source).toEqual(expectedBuffer);
            }), done).toResolve();
    });
});
