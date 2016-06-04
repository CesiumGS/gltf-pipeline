'use strict';
var clone = require('clone');
var gltfPipeline = require('../../lib/gltfPipeline');
var processJSON = gltfPipeline.processJSON;
var processFile = gltfPipeline.processFile;
var readGltf = require('../../lib/readGltf');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf file', function(done) {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSON(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
        processFile(gltfPath, options, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfCopy);
            done();
        })
    });
    
    it('optimizes a binary glTF file', function(done) {
        var gltfCopy;
        var options = {};
        readGltf(glbPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSON(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
        processFile(glbPath, options, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfCopy);
            done();
        });
    });
});
