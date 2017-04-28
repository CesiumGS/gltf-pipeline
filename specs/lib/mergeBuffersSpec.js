'use strict';
var mergeBuffers = require('../../lib/mergeBuffers');
var removePipelineExtras = require('../../lib/removePipelineExtras');

describe('mergeBuffers', function() {
    it('merges buffers', function() {
        var buffer0 = new Buffer([1, 2]);
        var buffer1 = new Buffer([3, 4, 5]);
        var bufferMerged = new Buffer([1, 2, 3, 4, 5]);
        var gltf = {
            bufferViews: [
                {
                    buffer: 0,
                    byteLength: 2,
                    byteOffset: 0
                },
                {
                    buffer: 1,
                    byteLength: 3,
                    byteOffset: 0
                }
            ],
            buffers: [
                {
                    byteLength: 2,
                    extras: {
                        _pipeline: {
                            source: buffer0,
                            extension: '.bin'
                        }
                    }
                },
                {
                    byteLength: 3,
                    extras: {
                        _pipeline: {
                            source: buffer1,
                            extension: '.bin'
                        }
                    }
                }
            ]
        };

        mergeBuffers(gltf);

        var buffer = gltf.buffers[0].extras._pipeline.source;
        removePipelineExtras(gltf);
        expect(gltf).toEqual({
            bufferViews: [
                {
                    buffer: 0,
                    byteLength: 2,
                    byteOffset: 0
                },
                {
                    buffer: 0,
                    byteLength: 3,
                    byteOffset: 2
                }
            ],
            buffers: [
                {
                    byteLength: 5
                }
            ]
        });
        for(var i = 0; i < bufferMerged.length; i++) {
            expect(buffer[i]).toEqual(bufferMerged[i]);
        }
    });
});
