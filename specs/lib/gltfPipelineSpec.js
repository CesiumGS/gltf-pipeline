'use strict';
var gltfPipeline = require('../../lib/gltfPipeline');
var readGltf = require('../../lib/readGltf');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var Cesium = require('cesium');
var defined = Cesium.defined;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf file', function(done) {
        readGltf(gltfPath, function(gltf) {
            var stringCopy = JSON.stringify(gltf);
            gltfPipeline(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(JSON.stringify(gltf)).not.toBe(stringCopy);
                done();
            });
        });
    });
    
    it('optimizes a binary glTF file', function(done) {
        readGltf(glbPath, function(gltf) {
            var stringCopy = JSON.stringify(gltf);
            gltfPipeline(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(JSON.stringify(gltf)).not.toBe(stringCopy);
                done();
            });
        });
    });
});
