'use strict';

var removeUnusedBuffers = require('../../').removeUnusedBuffers;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedBuffers', function() {
    it('removes a buffer', function() {
        var gltf = {
            "bufferViews": {
                "bufferView_29": {
                    "buffer": "CesiumTexturedBoxTest",
                    "byteLength": 72,
                    "byteOffset": 0,
                    "target": 34963
                }
            },
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "byteLength": 840,
                    "type": "arraybuffer",
                    "uri": "CesiumTexturedBoxTest.bin"
                },
                "unusedBufferId": {
                    "byteLength": 840,
                    "type": "arraybuffer",
                    "uri": "CesiumTexturedBoxTest.bin"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedBuffers(gltf, stats);
        expect(gltf.buffers.unusedBufferId).not.toBeDefined();
        expect(stats.numberOfBuffersRemoved).toEqual(1);
    });

    it('does not remove any buffers', function() {
        var gltf = {
            "bufferViews": {
                "bufferView_29": {
                    "buffer": "CesiumTexturedBoxTest",
                    "byteLength": 72,
                    "byteOffset": 0,
                    "target": 34963
                }
            },
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "byteLength": 840,
                    "type": "arraybuffer",
                    "uri": "CesiumTexturedBoxTest.bin"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedBuffers(gltf, stats);
        expect(gltf.buffers.CesiumTexturedBoxTest).toBeDefined();
        expect(stats.numberOfBuffersRemoved).toEqual(0);
    });
});