'use strict';
var gltfPipeline = require('../../lib/gltfPipeline');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var Cesium = require('cesium');
var defined = Cesium.defined;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('checks that gltf is defined when passing in a gltf file', function(done) {
        gltfPipeline({
            inputPath : gltfPath,
            separate : false
        }, function(gltf) {
            expect(defined(gltf)).toEqual(true);
            done();
        });
    });

    it('checks that gltf is defined when passing in a glb file', function(done) {
        gltfPipeline({
            inputPath : glbPath,
            separate : false
        }, function(gltf) {
            expect(defined(gltf)).toEqual(true);
            done();
        });
    });
});
