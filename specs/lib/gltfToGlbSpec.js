'use strict';
var fsExtra = require('fs-extra');
var gltfToGlb = require('../../lib/gltfToGlb');

var gltfPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';

describe('gltfToGlb', function() {
    it('gltfToGlb', function(done) {
        spyOn(console, 'log');
        var gltf = fsExtra.readJsonSync(gltfPath);
        var options = {
            separate: true,
            stats: true
        };
        expect(gltfToGlb(gltf, options)
            .then(function(results) {
                expect(Buffer.isBuffer(results.glb)).toBe(true);
                expect(results.separateResources).toBeDefined();
                expect(console.log).toHaveBeenCalled();
            }), done).toResolve();
    });
});
