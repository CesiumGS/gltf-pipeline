'use strict';
var tipsifyGltf = require('../../lib/tipsifyGltf');
var addDefaults = require('../../lib/addDefaults');
var readGltf = require('../../lib/readGltf');
var writeAccessor = require('../../lib/writeAccessor');
var readAccessor = require('../../lib/readAccessor');

var gltfPath = './specs/data/tipsifyGltf/chinesedragon.gltf';

describe('tipsifyGltf', function() {
    it('reorders indices', function(done) {
        readGltf(gltfPath, function(gltf) {
            addDefaults(gltf);
            var indexAccessorId = gltf.meshes[Object.keys(gltf.meshes)].primitives[0].indices;
            var indicesBefore = readAccessor(gltf, gltf.accessors[indexAccessorId]);
            
            tipsifyGltf(gltf);
            
            var indicesAfter = readAccessor(gltf, gltf.accessors[indexAccessorId]);
            expect(indicesBefore).not.toEqual(indicesAfter);
            done();
        });
    });
});