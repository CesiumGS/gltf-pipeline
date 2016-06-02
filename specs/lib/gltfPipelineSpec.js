'use strict';
var gltfPipeline = require('../../lib/gltfPipeline');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var Cesium = require('cesium');
var defined = Cesium.defined;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf file, checks that gltf is defined when passing in a gltf file', function(done) {
        gltfPipeline({
            inputPath : gltfPath,
            separate : false
        }, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfPath);
            done();
        });
    });

    it('optimizes a binary glTF file, checks that gltf is defined when passing in a glb file', function(done) {
        gltfPipeline({
            inputPath : glbPath,
            separate : false
        }, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(glbPath);
            done();
        });
    });
});
