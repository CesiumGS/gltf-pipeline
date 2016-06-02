'use strict';
var clone = require('clone');
var gltfPipeline = require('../../lib/gltfPipeline');
var readGltf = require('../../lib/readGltf');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf file', function(done) {
        readGltf(gltfPath, function(gltf) {
            var gltfCopy = clone(gltf);
            gltfPipeline(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
    });
    
    it('optimizes a binary glTF file', function(done) {
        readGltf(glbPath, function(gltf) {
            var gltfCopy = clone(gltf);
            gltfPipeline(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
    });
});
