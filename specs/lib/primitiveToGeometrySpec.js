'use strict';
var primitiveToGeometry = require('../../lib/primitiveToGeometry');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var positions = new Float64Array([ -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 
    -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 
    -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5 ]);
var normals = new Float32Array([ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 
    0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1 ]);
var indices = new Uint32Array([ 0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12, 13, 14, 15, 14, 13, 16, 17,
    18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ]);
var primitiveType = 4;

describe('primitiveToGeometry', function() {
    it('returns a geometry', function(done) {
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            addDefaults(gltf);
            var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
            var geometry = primitiveToGeometry(gltf, primitive);
            
            expect(geometry.attributes.position.values).toEqual(positions);
            expect(geometry.attributes.normal.values).toEqual(normals);
            expect(geometry.indices).toEqual(indices);
            expect(geometry.primitiveType).toEqual(primitiveType);
            done();
        });
    });
});
