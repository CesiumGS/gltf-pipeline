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
        readGltf(gltfPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSON(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
        processFile(gltfPath, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfCopy);
            done();
        })
    });
    
    it('optimizes a binary glTF file', function(done) {
        var gltfCopy;
        readGltf(glbPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSON(gltf, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
                done();
            });
        });
        processFile(glbPath, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfCopy);
            done();
        });
    });
});
