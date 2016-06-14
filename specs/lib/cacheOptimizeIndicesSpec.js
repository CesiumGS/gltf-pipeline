'use strict';
var cacheOptimizeIndices = require('../../lib/cacheOptimizeIndices');
var addDefaults = require('../../lib/addDefaults');
var readGltf = require('../../lib/readGltf');
var readAccessor = require('../../lib/readAccessor');

var gltfPath = './specs/data/cacheOptimizeIndices/chinesedragon.gltf';

describe('cacheOptimizeIndices', function() {
    it('reorders indices', function(done) {
        readGltf(gltfPath, function(gltf) {
            addDefaults(gltf);
            var indexAccessorId = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0].indices;
            var indicesBefore = readAccessor(gltf, gltf.accessors[indexAccessorId]);
            
            cacheOptimizeIndices(gltf);
            
            var indicesAfter = readAccessor(gltf, gltf.accessors[indexAccessorId]);
            expect(indicesBefore).not.toEqual(indicesAfter);
            done();
        });
    });
});