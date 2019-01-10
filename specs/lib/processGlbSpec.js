'use strict';
const fsExtra = require('fs-extra');
const processGlb = require('../../lib/processGlb');

const glbPath = 'specs/data/2.0/box-textured-binary/box-textured-binary.glb';

describe('processGlb', function() {
    it('processGlb', function(done) {
        spyOn(console, 'log');
        const glb = fsExtra.readFileSync(glbPath);
        const options = {
            separate: true,
            stats: true
        };
        expect(processGlb(glb, options)
            .then(function(results) {
                expect(Buffer.isBuffer(results.glb)).toBe(true);
                expect(results.separateResources).toBeDefined();
                expect(console.log).toHaveBeenCalled();
            }), done).toResolve();
    });
});
