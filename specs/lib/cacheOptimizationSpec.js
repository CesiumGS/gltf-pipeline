'use strict';
var cacheOptimization = require('../../lib/cacheOptimization');
var addDefaults = require('../../lib/addDefaults');
var readGltf = require('../../lib/readGltf');
var readAccessor = require('../../lib/readAccessor');
var writeAccessor = require('../../lib/writeAccessor');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var unoptimizedIndices = [ 3, 2, 1, 0, 1, 2, 7, 6, 5, 4, 5, 6, 8, 9, 10, 11, 10, 9, 12,
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 23, 22, 21, 20, 21, 22 ];

var optimizedIndices = [ 0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12,
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ];

var unoptimizedVertices = [ 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
    0.5, 0.5, -0.5 ];

var optimizedVertices = [ 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 
    -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
    0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5 ];


describe('cacheOptimization', function() {
    it('reorders indices', function(done) {
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            addDefaults(gltf);
            var indexAccessorId = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0].indices;
            var indexAccessor = gltf.accessors[indexAccessorId];
            // Rewrite indices to be forcibly unoptimized
            writeAccessor(gltf, indexAccessor, unoptimizedIndices);
            
            cacheOptimization(gltf);
            var indices = [];
            readAccessor(gltf, gltf.accessors[indexAccessorId], indices);
            
            expect(indices).toEqual(optimizedIndices);
            done();
        });
    });

    it('reorders independent attribute accessors', function(done) {
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            addDefaults(gltf);
            var positionAccessor = gltf.accessors.accessor_23;
            // Use write/read accessor to unpack the optimizedVertices for us
            writeAccessor(gltf, positionAccessor, optimizedVertices);
            var unpackedOptimizedVertices = [];
            readAccessor(gltf, positionAccessor, unpackedOptimizedVertices);
            // Write the forcibly unoptimized values
            writeAccessor(gltf, positionAccessor, unoptimizedVertices);
            var positions = [];
            readAccessor(gltf, positionAccessor, positions);
            
            cacheOptimization(gltf);
            
            expect(positions).toEqual(unpackedOptimizedVertices);
            done();
        });
    });
});
