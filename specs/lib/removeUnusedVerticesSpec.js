'use strict';
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var loadGltfUris = require('../../lib/loadGltfUris');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var removeUnusedVertices = require('../../lib/removeUnusedVertices');
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

var writeGltf = require('../../lib/writeGltf');

describe('removeUnusedVertices', function() {
    var testBuffer = new Buffer(840);
    var indexBuffer = new Buffer(1680);
    for (var i = 0; i < 840; i++) {
        indexBuffer.writeUInt16LE(i, 2*i);
    }
    var boxGltf;

    beforeAll(function(done) {
        fs.readFile(gltfPath, function(err, data) {
            if (err) {
                throw err;
            }
            else {
                boxGltf = JSON.parse(data);
                addPipelineExtras(boxGltf);
                loadGltfUris(boxGltf, path.dirname(gltfPath), function(err) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
            }
        });
    });

    it('does not remove any data with a single buffer view', function() {
        var testGltf = createTestGltf([0, 840]);
        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer)).toBe(true);
    });

    it('does not remove any data with overlapping buffer views', function() {
        var testGltf = createTestGltf([0, 360], [240, 600]);
        removeUnusedVertices(testGltf);

        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer)).toBe(true);
    });

    it('removes the beginning of a buffer', function() {
        var testGltf = createTestGltf([120, 360], [240, 600]);
        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120))).toBe(true);
    });

    it('removes the middle of a buffer', function() {
        var testGltf = createTestGltf([0, 360], [480, 360]);
        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(0, 360), testBuffer.slice(480)], 720))).toBe(true);
    });

    it('removes the end of a buffer', function() {
        var testGltf = createTestGltf([0, 360], [240, 480]);
        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(0, 720))).toBe(true);
    });

    it('removes multiple parts of a buffer', function() {
        var testGltf = createTestGltf([120, 240], [240, 360], [720, 80]);

        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(560);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(120, 600), testBuffer.slice(720, 800)], 560))).toBe(true);
    });

    it('removes multiple parts of a buffer', function() {
        var testGltf = createTestGltf([120, 120], [360, 240], [720, 80]);
        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(440);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, Buffer.concat([testBuffer.slice(120, 240), testBuffer.slice(360, 600), testBuffer.slice(720, 800)], 440))).toBe(true);
    });

    it('removes data from multiple buffers', function() {
        var testBuffer_1 = new Buffer(840);
        var testGltf = createTestGltf([120, 720], [0, 720]);
        testGltf.bufferViews.bufferView_1.buffer = 'buffer_1';
        testGltf.buffers.buffer_1 = {
            "uri": "data:,",
            "byteLength": 840,
            "extras": {
                "_pipeline": {
                    "source": testBuffer_1
                }
            }
        };

        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(testGltf.buffers.buffer_1.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120, 840))).toBe(true);
        expect(bufferEqual(testGltf.buffers.buffer_1.extras._pipeline.source, testBuffer_1.slice(0, 720))).toBe(true);
    });

    it('deletes an unreferenced buffer', function() {
        var testGltf = createTestGltf([120, 720]);
        testGltf.buffers.buffer_1 = {
            "uri": "data:,",
            "byteLength": 840,
            "extras": {
                "_pipeline": {
                    "source": new Buffer(840)
                }
            }
        };

        removeUnusedVertices(testGltf);

        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(testGltf.buffers.buffer_1).not.toBeDefined();
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(120, 840))).toBe(true);
    });

    it('removes the beginning of a bufferView', function() {
        var testIndexBuffer = new Buffer(indexBuffer);
        for (var i = 0; i < 240; i++) {
            testIndexBuffer.writeUInt16LE(240, 2*i);
        }
        var testGltf = createTestGltf([120, 720]);
        testGltf.buffers.index_buffer.extras._pipeline.source = testIndexBuffer;
        removeUnusedVertices(testGltf);

        expect(testGltf.accessors.accessor_0.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_0.count).toEqual(480);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(480);
        expect(testGltf.bufferViews.bufferView_0.byteOffset).toEqual(0);
        expect(testGltf.bufferViews.bufferView_0.byteLength).toEqual(480);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(360))).toBe(true);
    });

    it('removes the middle of a bufferView', function() {
        var testIndexBuffer = new Buffer(indexBuffer);
        for (var i = 240; i < 360; i++) {
            testIndexBuffer.writeUInt16LE(360, 2*i);
        }
        var testGltf = createTestGltf([0, 840]);
        testGltf.buffers.index_buffer.extras._pipeline.source = testIndexBuffer;
        removeUnusedVertices(testGltf);

        expect(testGltf.accessors.accessor_0.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_0.count).toEqual(720);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(testGltf.bufferViews.bufferView_0.byteOffset).toEqual(0);
        expect(testGltf.bufferViews.bufferView_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(0, 240), testBuffer.slice(360)], 720))).toBe(true);
    });

    it('removes the end of a bufferView', function() {
        var testIndexBuffer = new Buffer(indexBuffer);
        for (var i = 720; i < 840; i++) {
            testIndexBuffer.writeUInt16LE(719, 2*i);
        }
        var testGltf = createTestGltf([0, 840]);
        testGltf.buffers.index_buffer.extras._pipeline.source = testIndexBuffer;
        removeUnusedVertices(testGltf);

        expect(testGltf.accessors.accessor_0.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_0.count).toEqual(720);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(720);
        expect(testGltf.bufferViews.bufferView_0.byteOffset).toEqual(0);
        expect(testGltf.bufferViews.bufferView_0.byteLength).toEqual(720);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, testBuffer.slice(0, 720))).toBe(true);
    });

    it('removes multiple parts of a bufferView', function() {
        var testIndexBuffer = new Buffer(indexBuffer);
        for (var i = 0; i < 120; i++) {
            testIndexBuffer.writeUInt16LE(120, 2*i);
        }
        for (var i = 360; i < 480; i++) {
            testIndexBuffer.writeUInt16LE(480, 2*i);
        }
        for (var i = 720; i < 840; i++) {
            testIndexBuffer.writeUInt16LE(719, 2*i);
        }
        var testGltf = createTestGltf([0, 840]);
        testGltf.buffers.index_buffer.extras._pipeline.source = testIndexBuffer;
        removeUnusedVertices(testGltf);

        expect(testGltf.accessors.accessor_0.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_0.count).toEqual(480);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(480);
        expect(testGltf.bufferViews.bufferView_0.byteOffset).toEqual(0);
        expect(testGltf.bufferViews.bufferView_0.byteLength).toEqual(480);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(120, 360), testBuffer.slice(480, 720)], 480))).toBe(true);
    });

    it('removes multiple parts of a bufferView', function() {
        var testIndexBuffer = new Buffer(indexBuffer);
        for (var i = 0; i < 80; i++) {
            testIndexBuffer.writeUInt16LE(80, 2*i);
        }
        for (var i = 160; i < 240; i++) {
            testIndexBuffer.writeUInt16LE(240, 2*i);
        }
        for (var i = 360; i < 420; i++) {
            testIndexBuffer.writeUInt16LE(359, 2*i);
        }
        var testGltf = createTestGltf([0, 420], [420, 420]);
        testGltf.buffers.index_buffer.extras._pipeline.source = testIndexBuffer;
        removeUnusedVertices(testGltf);

        expect(testGltf.accessors.accessor_0.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_0.count).toEqual(200);
        expect(testGltf.accessors.accessor_1.byteOffset).toEqual(0);
        expect(testGltf.accessors.accessor_1.count).toEqual(200);
        expect(testGltf.buffers.buffer_0.byteLength).toEqual(400);
        expect(testGltf.bufferViews.bufferView_0.byteOffset).toEqual(0);
        expect(testGltf.bufferViews.bufferView_1.byteOffset).toEqual(200);
        expect(testGltf.bufferViews.bufferView_0.byteLength).toEqual(200);
        expect(testGltf.bufferViews.bufferView_1.byteLength).toEqual(200);
        expect(bufferEqual(testGltf.buffers.buffer_0.extras._pipeline.source, 
            Buffer.concat([testBuffer.slice(80, 160), testBuffer.slice(240, 360),
                testBuffer.slice(500, 580), testBuffer.slice(660, 780)], 400))).toBe(true);

        delete testGltf.buffers.buffer_0.extras;
    });

    it('removes the beginning of the box bufferView', function() {
        var testBoxGltf = clone(boxGltf);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(4, 2 * 0);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 1);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 2);

        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(7, 2 * 3);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 4);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 5);

        removeUnusedVertices(testBoxGltf);

        expect(testBoxGltf.accessors.accessor_23.byteOffset).toEqual(0);
        expect(testBoxGltf.accessors.accessor_23.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_25.byteOffset).toEqual(240);
        expect(testBoxGltf.accessors.accessor_25.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_27.byteOffset).toEqual(480);
        expect(testBoxGltf.accessors.accessor_27.count).toEqual(20);

        expect(testBoxGltf.bufferViews.bufferView_29.byteOffset).toEqual(0);
        expect(testBoxGltf.bufferViews.bufferView_29.byteLength).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteOffset).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteLength).toEqual(640);

        expect(testBoxGltf.buffers.CesiumTexturedBoxTest.byteLength).toEqual(712);

        var oldPositionBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 360);
        var oldNormalBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(360, 648);
        var oldTextureBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(648, 840);
        
        var newPositionBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 312);
        var newNormalBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(312, 552);
        var newTextureBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(552, 712);

        expect(bufferEqual(newPositionBuffer, oldPositionBuffer.slice(48))).toBe(true);
        expect(bufferEqual(newNormalBuffer, oldNormalBuffer.slice(48))).toBe(true);
        expect(bufferEqual(newTextureBuffer, oldTextureBuffer.slice(32))).toBe(true);
    });

    it('removes the middle of the box bufferView', function() {
        var testBoxGltf = clone(boxGltf);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(0, 2 * 12);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(1, 2 * 13);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(2, 2 * 14);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(3, 2 * 15);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(2, 2 * 16);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(1, 2 * 17);

        removeUnusedVertices(testBoxGltf);

        expect(testBoxGltf.accessors.accessor_23.byteOffset).toEqual(0);
        expect(testBoxGltf.accessors.accessor_23.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_25.byteOffset).toEqual(240);
        expect(testBoxGltf.accessors.accessor_25.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_27.byteOffset).toEqual(480);
        expect(testBoxGltf.accessors.accessor_27.count).toEqual(20);

        expect(testBoxGltf.bufferViews.bufferView_29.byteOffset).toEqual(0);
        expect(testBoxGltf.bufferViews.bufferView_29.byteLength).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteOffset).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteLength).toEqual(640);

        expect(testBoxGltf.buffers.CesiumTexturedBoxTest.byteLength).toEqual(712);

        var oldPositionBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 360);
        var oldNormalBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(360, 648);
        var oldTextureBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(648, 840);
        
        var newPositionBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 312);
        var newNormalBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(312, 552);
        var newTextureBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(552, 712);

        expect(bufferEqual(newPositionBuffer, Buffer.concat([oldPositionBuffer.slice(0, 96), 
            oldPositionBuffer.slice(144)], 240))).toBe(true);

        expect(bufferEqual(newNormalBuffer, Buffer.concat([oldNormalBuffer.slice(0, 96), 
            oldNormalBuffer.slice(144)], 240))).toBe(true);

        expect(bufferEqual(newTextureBuffer, Buffer.concat([oldTextureBuffer.slice(0, 64), 
            oldTextureBuffer.slice(96)], 160))).toBe(true);
    });

    it('removes the end of the box bufferView', function() {
        var testBoxGltf = clone(boxGltf);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(0, 2 * 30);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(1, 2 * 31);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(2, 2 * 32);

        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(3, 2 * 33);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(2, 2 * 34);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(1, 2 * 35);

        removeUnusedVertices(testBoxGltf);

        expect(testBoxGltf.accessors.accessor_23.byteOffset).toEqual(0);
        expect(testBoxGltf.accessors.accessor_23.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_25.byteOffset).toEqual(240);
        expect(testBoxGltf.accessors.accessor_25.count).toEqual(20);
        expect(testBoxGltf.accessors.accessor_27.byteOffset).toEqual(480);
        expect(testBoxGltf.accessors.accessor_27.count).toEqual(20);

        expect(testBoxGltf.bufferViews.bufferView_29.byteOffset).toEqual(0);
        expect(testBoxGltf.bufferViews.bufferView_29.byteLength).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteOffset).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteLength).toEqual(640);

        expect(testBoxGltf.buffers.CesiumTexturedBoxTest.byteLength).toEqual(712);

        var oldPositionBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 360);
        var oldNormalBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(360, 648);
        var oldTextureBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(648, 840);
        
        var newPositionBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 312);
        var newNormalBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(312, 552);
        var newTextureBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(552, 712);

        expect(bufferEqual(newPositionBuffer, oldPositionBuffer.slice(0, 240))).toBe(true);
        expect(bufferEqual(newNormalBuffer, oldNormalBuffer.slice(0, 240))).toBe(true);
        expect(bufferEqual(newTextureBuffer, oldTextureBuffer.slice(0, 160))).toBe(true);
    });

    it('removes multiple parts of the box bufferView', function() {
        var testBoxGltf = clone(boxGltf);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(4, 2 * 0);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 1);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 2);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(7, 2 * 3);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 4);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 5);

        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(4, 2 * 12);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 13);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 14);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(7, 2 * 15);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 16);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 17);

        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(4, 2 * 30);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 31);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 32);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(7, 2 * 33);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(6, 2 * 34);
        testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.writeUInt16LE(5, 2 * 35);

        removeUnusedVertices(testBoxGltf);

        expect(testBoxGltf.accessors.accessor_23.byteOffset).toEqual(0);
        expect(testBoxGltf.accessors.accessor_23.count).toEqual(12);
        expect(testBoxGltf.accessors.accessor_25.byteOffset).toEqual(144);
        expect(testBoxGltf.accessors.accessor_25.count).toEqual(12);
        expect(testBoxGltf.accessors.accessor_27.byteOffset).toEqual(288);
        expect(testBoxGltf.accessors.accessor_27.count).toEqual(12);

        expect(testBoxGltf.bufferViews.bufferView_29.byteOffset).toEqual(0);
        expect(testBoxGltf.bufferViews.bufferView_29.byteLength).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteOffset).toEqual(72);
        expect(testBoxGltf.bufferViews.bufferView_30.byteLength).toEqual(384);

        expect(testBoxGltf.buffers.CesiumTexturedBoxTest.byteLength).toEqual(456);

        var oldPositionBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 360);
        var oldNormalBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(360, 648);
        var oldTextureBuffer = boxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(648, 840);
        
        var newPositionBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(72, 216);
        var newNormalBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(216, 360);
        var newTextureBuffer = testBoxGltf.buffers.CesiumTexturedBoxTest.extras._pipeline.source.slice(360, 456);

        expect(bufferEqual(newPositionBuffer, Buffer.concat([oldPositionBuffer.slice(48, 96), 
            oldPositionBuffer.slice(144, 240)], 144))).toBe(true);

        expect(bufferEqual(newNormalBuffer, Buffer.concat([oldNormalBuffer.slice(48, 96), 
            oldNormalBuffer.slice(144, 240)], 144))).toBe(true);

        expect(bufferEqual(newTextureBuffer, Buffer.concat([oldTextureBuffer.slice(32, 64), 
            oldTextureBuffer.slice(96, 160)], 96))).toBe(true);
    });

    it('removes parts of the buffer based on the attribute type if the stride is 0', function(){
        var indices = [0,1,2,0,2,3];
        var indicesBuffer = new Buffer(indices.length * 2);
        for (var i = 0; i < indices.length; i++) {
            indicesBuffer.writeUInt16LE(indices[i], i * 2);
        }

        var positions = [
            0,0,0,
            0,1,0,
            1,1,0,
            1,0,0,
            2,2,2,
            2,2,2,
            2,2,2
        ];
        var positionsBuffer = new Buffer(positions.length * 2);
        for (var i = 0; i < positions.length; i++) {
            positionsBuffer.writeUInt16LE(positions[i], i * 2);
        }

        var dataBuffer = Buffer.concat([indicesBuffer, positionsBuffer]);

        var testGltf = {
            "accessors": {
                "accessor_index": {
                    "bufferView": "index_view",
                    "byteOffset": 0,
                    "componentType": 5123,
                    "count": 6,
                    "type": "SCALAR",
                    "extras": {
                        "_pipeline": {}
                    }
                },
                "accessor_position": {
                    "bufferView": "position_view",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 4,
                    "type": "VEC3",
                    "extras": {
                        "_pipeline": {}
                    }
                }
            },
            "bufferViews": {
                "position_view": {
                    "buffer": "buffer_0",
                    "byteOffset": 6 * 2,
                    "byteLength": 4 * 3 * 2,
                    "target": 34962,
                    "extras": {
                        "_pipeline": {}
                    }
                },
                "index_view": {
                    "buffer": "buffer_0",
                    "byteOffset": 0,
                    "byteLength": 6 * 2,
                    "target": 34963,
                    "extras": {
                        "_pipeline": {}
                    }
                }
            },
            "buffers": {
                "buffer_0": {
                    "uri": "data:",
                    "byteLength": indices.concat(positions).length * 2,
                    "extras": {
                        "_pipeline": {
                            "source": dataBuffer
                        }
                    }
                }
            },
            "meshes": {
                "mesh_square": {
                    "name": "square",
                    "primitives": [
                        {
                            "attributes": {
                                "POSITION": "accessor_position"
                            },
                            "indices": "accessor_index"
                        }
                    ]
                }
            }
        }

        removeUnusedVertices(testGltf);
        expect(testGltf.buffers["buffer_0"].byteLength).toEqual(6 * 2 + 4 * 3 * 2);

    });

    it('handles 8 bit indices', function(){
        var indices = [0,1,2,0,2,3];
        var indicesBuffer = new Buffer(indices.length);
        for (var i = 0; i < indices.length; i++) {
            indicesBuffer.writeUInt8(indices[i], i);
        }

        var positions = [
            0,0,0,
            0,1,0,
            1,1,0,
            1,0,0,
            2,2,2,
            2,2,2,
            2,2,2
        ];
        var positionsBuffer = new Buffer(positions.length * 2);
        for (var i = 0; i < positions.length; i++) {
            positionsBuffer.writeUInt16LE(positions[i], i * 2);
        }

        var dataBuffer = Buffer.concat([indicesBuffer, positionsBuffer]);

        var testGltf = {
            "accessors": {
                "accessor_index": {
                    "bufferView": "index_view",
                    "byteOffset": 0,
                    "componentType": 5121, // unsigned short
                    "count": 6,
                    "type": "SCALAR",
                    "extras": {
                        "_pipeline": {}
                    }
                },
                "accessor_position": {
                    "bufferView": "position_view",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 4,
                    "type": "VEC3",
                    "extras": {
                        "_pipeline": {}
                    }
                }
            },
            "bufferViews": {
                "position_view": {
                    "buffer": "buffer_0",
                    "byteOffset": 6,
                    "byteLength": 4 * 3 * 2,
                    "target": 34962,
                    "extras": {
                        "_pipeline": {}
                    }
                },
                "index_view": {
                    "buffer": "buffer_0",
                    "byteOffset": 0,
                    "byteLength": 6,
                    "target": 34963,
                    "extras": {
                        "_pipeline": {}
                    }
                }
            },
            "buffers": {
                "buffer_0": {
                    "uri": "data:",
                    "byteLength": indices.length + positions.length * 2,
                    "extras": {
                        "_pipeline": {
                            "source": dataBuffer
                        }
                    }
                }
            },
            "meshes": {
                "mesh_square": {
                    "name": "square",
                    "primitives": [
                        {
                            "attributes": {
                                "POSITION": "accessor_position"
                            },
                            "indices": "accessor_index"
                        }
                    ]
                }
            }
        }

        removeUnusedVertices(testGltf);
        expect(testGltf.buffers["buffer_0"].byteLength).toEqual(6 + 4 * 3 * 2);

    });

    function createTestGltf() {
        var testGltf = {
            "accessors": {
            },
            "buffers": {
                "buffer_0": {
                    "uri": "data:,",
                    "byteLength": 840,
                    "extras": {
                        "_pipeline": {
                            "source": new Buffer(testBuffer)
                        }
                    }
                },
                "index_buffer": {
                    "uri": "data:,",
                    "byteLength": 840,
                    "extras": {
                        "_pipeline": {
                            "source": new Buffer(indexBuffer)
                        }
                    }
                }
            },
            "bufferViews": {
                "index_bufferView": {
                    "buffer": "index_buffer",
                    "byteOffset": 0,
                    "byteLength": 1680,
                    "extras": {
                        "_pipeline": {
                        }
                    }
                }
            },
            "meshes": {
                "mesh_0": {
                    "primitives": []
                }
            }
        };

        for (var i = 0; i < arguments.length; i++) {
            var offset = arguments[i][0];
            var length = arguments[i][1];

            var accessorId = 'accessor_' + i;
            var indexAccessorId = 'index_accessor_' + i;
            var bufferViewId = 'bufferView_' + i;
            testGltf.bufferViews[bufferViewId] = {
                "buffer": "buffer_0",
                "byteOffset": offset,
                "byteLength": length,
                "extras": {
                    "_pipeline": {}
                }
            }
            
            testGltf.accessors[accessorId] = {
                "bufferView": bufferViewId,
                "byteOffset": 0,
                "componentType": 5121,
                "count": length,
                "type": "SCALAR",
                "extras": {
                    "_pipeline": {}
                }
            };

            testGltf.accessors[indexAccessorId] = {
                "bufferView": "index_bufferView",
                "byteOffset": 0,
                "componentType": 5123,
                "count": length,
                "type": "SCALAR",
                "extras": {
                    "_pipeline": {}
                }
            };

            testGltf.meshes.mesh_0.primitives.push({
                "attributes": {
                    "attribute_0": accessorId
                },
                "indices": indexAccessorId,
                "material": "Effect-Texture",
                "mode": 4
            });
        }
        return testGltf;
    }
});