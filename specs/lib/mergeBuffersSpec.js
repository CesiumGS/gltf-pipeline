'use strict';

var mergeBuffers = require('../../lib/mergeBuffers');

describe('mergeBuffers', function() {
    it('merges buffers', function() {
        var buffer0 = new Buffer([1, 2]);
        var buffer1 = new Buffer([3, 4, 5]);
        var bufferMerged = new Buffer([1, 2, 3, 4, 5]);
        var gltf = {
            "bufferViews": {
                "bufferView_0": {
                    "buffer": "bufferView_0_buffer",
                    "byteLength": 2,
                    "byteOffset": 0
                },
                "bufferView_1": {
                    "buffer": "bufferView_1_buffer",
                    "byteLength": 3,
                    "byteOffset": 0
                }
            },
            "buffers": {
                "bufferView_0_buffer": {
                    "byteLength": 2,
                    "type": "arraybuffer",
                    "uri": "data:,",
                    "extras": {
                        "_pipeline": {
                            "source": buffer0,
                            "extension": ".bin",
                            "deleteExtras": true
                        }
                    }
                },
                "bufferView_1_buffer": {
                    "byteLength": 3,
                    "type": "arraybuffer",
                    "uri": "data:,",
                    "extras": {
                        "_pipeline": {
                            "source": buffer1,
                            "extension": ".bin",
                            "deleteExtras": true
                        }
                    }
                }
            }
        };

        mergeBuffers(gltf, 'mergedBuffers');

        expect(gltf).toEqual({
            "bufferViews": {
                "bufferView_0": {
                    "buffer": "mergedBuffers",
                    "byteLength": 2,
                    "byteOffset": 0
                },
                "bufferView_1": {
                    "buffer": "mergedBuffers",
                    "byteLength": 3,
                    "byteOffset": 2
                }
            },
            "buffers": {
                "mergedBuffers": {
                    "byteLength": 5,
                    "type": "arraybuffer",
                    "uri": "data:,",
                    "extras": {
                        "_pipeline": {
                            "source": bufferMerged,
                            "extension": ".bin",
                            "deleteExtras": true
                        }
                    }
                }
            }
        });
    });
});
