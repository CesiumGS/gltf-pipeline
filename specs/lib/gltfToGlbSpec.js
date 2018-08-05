'use strict';
var fsExtra = require('fs-extra');
var gltfToGlb = require('../../lib/gltfToGlb');

var gltfPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';

describe('gltfToGlb', function() {
    it('gltfToGlb', function(done) {
        spyOn(console, 'log');
        var gltf = fsExtra.readJsonSync(gltfPath);
        var options = {
            separateTextures: true,
            stats: true
        };
        expect(gltfToGlb(gltf, options)
            .then(function(results) {
                var glb = results.glb;
                var separateResources = results.separateResources;
                expect(Buffer.isBuffer(glb)).toBe(true);
                expect(Object.keys(separateResources).length).toBe(1);
                expect(console.log).toHaveBeenCalled();

                // Header + JSON header + JSON content + binary header + binary content
                var glbLength = glb.readUInt32LE(8);
                var jsonChunkLength = glb.readUInt32LE(12);
                var binaryChunkLength = glb.readUInt32LE(12 + 8 + jsonChunkLength);
                var expectedLength = 12 + 8 + jsonChunkLength + 8 + binaryChunkLength;
                expect(glbLength).toBe(expectedLength);
                expect(glb.length).toBe(expectedLength);
            }), done).toResolve();
    });

    it('gltfToGlb with separate resources', function(done) {
        spyOn(console, 'log');
        var gltf = fsExtra.readJsonSync(gltfPath);
        var options = {
            separate: true,
            stats: true
        };
        expect(gltfToGlb(gltf, options)
            .then(function(results) {
                var glb = results.glb;
                var separateResources = results.separateResources;
                expect(Buffer.isBuffer(glb)).toBe(true);
                expect(Object.keys(separateResources).length).toBe(2);
                expect(console.log).toHaveBeenCalled();

                // Header + JSON header + JSON content. No binary header or content.
                var glbLength = glb.readUInt32LE(8);
                var jsonChunkLength = glb.readUInt32LE(12);
                var expectedLength = 12 + 8 + jsonChunkLength;
                expect(glbLength).toBe(expectedLength);
                expect(glb.length).toBe(expectedLength);
            }), done).toResolve();
    });
});
