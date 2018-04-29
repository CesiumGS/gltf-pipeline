'use strict';
var fsExtra = require('fs-extra');
var processGltf = require('../../lib/processGltf');

var gltfPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';


describe('processGltf', function() {
    it('processGltf', function(done) {
        spyOn(console, 'log');
        var gltf = fsExtra.readJsonSync(gltfPath);
        var options = {
            separate: true,
            stats: true
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(results.separateResources).toBeDefined();
                expect(results.gltf.buffers.length).toBe(1);
                expect(console.log).toHaveBeenCalled();
            }), done).toResolve();
    });
});
