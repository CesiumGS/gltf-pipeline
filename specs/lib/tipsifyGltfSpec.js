'use strict';
var clone = require('clone');
var tipsifyGltf = require('../../lib/tipsifyGltf');
var addDefaults = require('../../lib/addDefaults');
var readGltf = require('../../lib/readgltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

describe('tipsifyGltf', function() {
    it('reorders indices', function(done) {
        readGltf(gltfPath, function(gltf) {
            addDefaults(gltf);
            var copyGltf = clone(gltf);
            tipsifyGltf(gltf);
            
            expect(clone(gltf)).not.toEqual(copyGltf);
            done();
        });
    });
});