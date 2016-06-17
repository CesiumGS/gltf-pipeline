'use strict';
var cacheOptimizeIndices = require('../../lib/cacheOptimizeIndices');
var addDefaults = require('../../lib/addDefaults');
var readGltf = require('../../lib/readGltf');
var readAccessor = require('../../lib/readAccessor');
var writeAccessor = require('../../lib/writeAccessor');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var unoptimizedIndices = [ 3, 2, 1, 0, 1, 2, 7, 6, 5, 4, 5, 6, 8, 9, 10, 11, 10, 9, 12,
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 23, 22, 21, 20, 21, 22 ];

var optimizedIndices = [ 0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12,
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ];

describe('cacheOptimizeIndices', function() {
    it('reorders indices', function(done) {
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            addDefaults(gltf);
            var indexAccessorId = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0].indices;
            var indexAccessor = gltf.accessors[indexAccessorId];
            var indicesBefore = readAccessor(gltf, indexAccessor);
            // Rewrite indices to be forcibly unoptimized
            indicesBefore.data = unoptimizedIndices;
            writeAccessor(gltf, indexAccessor, indicesBefore.data);
            
            cacheOptimizeIndices(gltf);
            var indicesAfter = readAccessor(gltf, gltf.accessors[indexAccessorId]);
            
            expect(indicesAfter.data).toEqual(optimizedIndices);
            done();
        });
    });
});