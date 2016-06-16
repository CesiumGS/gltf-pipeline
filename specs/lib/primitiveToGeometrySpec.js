'use strict';
var primitiveToGeometry = require('../../lib/primitiveToGeometry');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

describe('primitiveToGeometry', function() {
    it('returns a geometry', function(done) {
        readGltf(gltfPath, function(gltf) {
            addDefaults(gltf);
            var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
            var geometry = primitiveToGeometry(gltf, primitive);
            
            expect(geometry).toBeDefined();
            done();
        });
    });
});
