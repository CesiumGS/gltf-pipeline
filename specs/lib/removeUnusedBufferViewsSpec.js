'use strict';

var removeUnusedBufferViews = require('../../lib/removeUnusedBufferViews');
var OptimizationStatistics = require('../../lib/OptimizationStatistics');

describe('removeUnusedBufferViews', function() {
    it('removes a bufferView', function() {
        var gltf = {
            "accessors": {
                "accessor_21": {
                    "bufferView": "bufferView_29",
                    "byteOffset": 0,
                    "byteStride": 0,
                    "componentType": 5123,
                    "count": 36,
                    "type": "SCALAR"
                }
            },
            "bufferViews": {
                "bufferView_29": {
                    "buffer": "CesiumTexturedBoxTest",
                    "byteLength": 72,
                    "byteOffset": 0,
                    "target": 34963
                },
                "unusedBufferViewId": {
                    "buffer": "CesiumTexturedBoxTest",
                    "byteLength": 768,
                    "byteOffset": 72,
                    "target": 34962
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedBufferViews(gltf, stats);
        expect(gltf.bufferViews.unusedBufferViewId).not.toBeDefined();
        expect(stats.numberRemoved.bufferViews).toEqual(1);
    });

    it('does not remove any buffers', function() {
        var gltf = {
            "accessors": {
                "accessor_21": {
                    "bufferView": "bufferView_29",
                    "byteOffset": 0,
                    "byteStride": 0,
                    "componentType": 5123,
                    "count": 36,
                    "type": "SCALAR"
                }
            },
            "bufferViews": {
                "bufferView_29": {
                    "buffer": "CesiumTexturedBoxTest",
                    "byteLength": 72,
                    "byteOffset": 0,
                    "target": 34963
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedBufferViews(gltf, stats);
        expect(gltf.bufferViews.bufferView_29).toBeDefined();
        expect(stats.numberRemoved.bufferViews).toEqual(0);
    });
});