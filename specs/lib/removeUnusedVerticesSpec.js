'use strict';
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var removeUnusedVertices = require('../../lib/removeUnusedVertices');

describe('removeUnusedVertices', function() {
    var testBuffer = new Buffer(840);
    var gltf = {
        "buffers": {
            "buffer_0": {
                "uri": "data:,",
                "byteLength": 840,
                "extras": {
                    "_pipeline": {
                        "source": testBuffer
                    }
                }
            }
        }
    };

    it('does not remove any data with a single buffer view', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 0,
                "byteLength": 840
            }
        };
        
        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer)).toBe(true);
    });

    it('does not remove any data with overlapping buffer views', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 0,
                "byteLength": 360
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 240,
                "byteLength": 600
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer)).toBe(true);
    });

    it('removes the beginning of a buffer', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 120,
                "byteLength": 360
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 240,
                "byteLength": 600
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
    });

    it('removes the middle of a buffer', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 0,
                "byteLength": 360
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 480,
                "byteLength": 360
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(0, 360), testBuffer.slice(480)], 720))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
    });

    it('removes the end of a buffer', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 0,
                "byteLength": 360
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 240,
                "byteLength": 480
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(0, 720))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
    });

    it('removes multiple parts of a buffer', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 120,
                "byteLength": 240
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 240,
                "byteLength": 360
            },
            "bufferView_2": {
                "buffer": "buffer_0",
                "byteOffset": 720,
                "byteLength": 80
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(120, 600), testBuffer.slice(720, 800)], 560))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(560);
    });

    it('removes multiple parts of a buffer', function() {
        var testGltf = clone(gltf);
        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 120,
                "byteLength": 120
            },
            "bufferView_1": {
                "buffer": "buffer_0",
                "byteOffset": 360,
                "byteLength": 240
            },
            "bufferView_2": {
                "buffer": "buffer_0",
                "byteOffset": 720,
                "byteLength": 80
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, Buffer.concat([testBuffer.slice(120, 240), testBuffer.slice(360, 600), testBuffer.slice(720, 800)], 440))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(440);
    });

    it('removes data from multiple buffers', function() {
        var testGltf = clone(gltf);
        var testBuffer_1 = new Buffer(840);
        testGltf.buffers.buffer_1 = {
            "uri": "data:,",
            "byteLength": 840,
            "extras": {
                "_pipeline": {
                    "source": testBuffer_1
                }
            }
        };

        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 120,
                "byteLength": 720
            },
            "bufferView_1": {
                "buffer": "buffer_1",
                "byteOffset": 0,
                "byteLength": 720
            }
        };

        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120, 840))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_1.extras._pipeline.source, testBuffer_1.slice(0, 720))).toBe(true);
        expect(testGltf.buffers.buffer_1.byteLength).toEqual(720);
    });

    it('deletes an unreferenced buffer', function() {
        var testGltf = clone(gltf);
        testGltf.buffers.buffer_1 = {
            "uri": "data:,",
            "byteLength": 840,
            "extras": {
                "_pipeline": {
                    "source": new Buffer(840)
                }
            }
        };

        testGltf.bufferViews = {
            "bufferView_0": {
                "buffer": "buffer_0",
                "byteOffset": 120,
                "byteLength": 720
            }
        };

        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_1).not.toBeDefined();
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120, 840))).toBe(true);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
    });
});