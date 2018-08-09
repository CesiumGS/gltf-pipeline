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

    it('merges buffers based on mergedBufferName', function(done) {
        var buffer0 = Buffer.from((new Uint8Array([1, 1, 1, 1])));
        var buffer1 = Buffer.from((new Uint8Array([2, 2, 2, 2])));
        var buffer2 = Buffer.from((new Uint8Array([3])));
        var buffer3 = Buffer.from((new Uint8Array([5, 5])));
        var buffer4 = Buffer.from((new Uint8Array([4, 4, 4])));
        var buffer5 = Buffer.from((new Uint8Array([6, 7])));

        var dataUri0 = 'data:application/octet-stream;base64,' + buffer0.toString('base64');
        var dataUri1 = 'data:application/octet-stream;base64,' + buffer1.toString('base64');
        var dataUri2 = 'data:application/octet-stream;base64,' + buffer2.toString('base64');
        var dataUri3 = 'data:application/octet-stream;base64,' + buffer3.toString('base64');
        var dataUri4 = 'data:application/octet-stream;base64,' + buffer4.toString('base64');
        var dataUri5 = 'data:application/octet-stream;base64,' + buffer5.toString('base64');

        // All buffer views start on 4-byte alignment, the buffer ends on a 4-byte alignment, and extraneous buffer data is removed
        var expectedBuffer0 = Buffer.from((new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2])));
        var expectedBuffer1 = Buffer.from((new Uint8Array([3, 0, 0, 0, 4, 4, 4, 0])));
        var expectedBuffer2 = Buffer.from((new Uint8Array([5, 5, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0])));

        var gltf = {
            bufferViews: [
                {
                    buffer: 0,
                    byteOffset: 0,
                    byteLength: 4
                },
                {
                    buffer: 1,
                    byteOffset: 0,
                    byteLength: 4
                },
                {
                    buffer: 2,
                    byteOffset: 0,
                    byteLength: 1
                },
                {
                    buffer: 3,
                    byteOffset: 0,
                    byteLength: 2
                },
                {
                    buffer: 4,
                    byteOffset: 0,
                    byteLength: 3
                },
                {
                    buffer: 5,
                    byteOffset: 0,
                    byteLength: 1
                },
                {
                    buffer: 5,
                    byteOffset: 1,
                    byteLength: 1
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
                },
                {
                    byteLength: buffer2.length,
                    uri: dataUri2
                },
                {
                    byteLength: buffer3.length,
                    uri: dataUri3
                },
                {
                    byteLength: buffer4.length,
                    uri: dataUri4
                },
                {
                    byteLength: buffer5.length,
                    uri: dataUri5
                }
            ]
        };

        expect(readResources(gltf)
            .then(function(gltf) {
                gltf.buffers[0].extras._pipeline.mergedBufferName = 'first';
                gltf.buffers[1].extras._pipeline.mergedBufferName = 'first';
                gltf.buffers[2].extras._pipeline.mergedBufferName = 'second';
                gltf.buffers[3].extras._pipeline.mergedBufferName = undefined;
                gltf.buffers[4].extras._pipeline.mergedBufferName = 'second';
                gltf.buffers[5].extras._pipeline.mergedBufferName = undefined;

                mergeBuffers(gltf);
                expect(gltf.buffers.length).toBe(3);
                expect(gltf.buffers[0].extras._pipeline.source).toEqual(expectedBuffer0);
                expect(gltf.buffers[0].name).toEqual('buffer-first');
                expect(gltf.buffers[1].extras._pipeline.source).toEqual(expectedBuffer1);
                expect(gltf.buffers[1].name).toEqual('buffer-second');
                expect(gltf.buffers[2].extras._pipeline.source).toEqual(expectedBuffer2);
                expect(gltf.buffers[2].name).toBe('buffer');
            }), done).toResolve();
    });
});
