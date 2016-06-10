'use strict';
var clone = require('clone');
var tipsifyGltf = require('../../lib/tipsifyGltf');
var addDefaults = require('../../lib/addDefaults');
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readgltf');

var gltfPath = './specs/data/tipsifyGltf/Cesium_Ground.gltf';

describe('tipsifyGltf', function() {
    

    it('reorders indices', function(done) {
        readGltf(gltfPath, function(gltf) {
            addDefaults(gltf);
            var copyGltf = clone(gltf);
            tipsifyGltf(gltf);
            
            var indices = [];
            var accessors = gltf.accessors;
            var meshes = gltf.meshes;
            for (var meshId in meshes) {
                if (meshes.hasOwnProperty(meshId)) {
                    var mesh = meshes[meshId];
                    var primitives = mesh.primitives;
                    var primitivesLength = primitives.length;
                    for (var i = 0; i < primitivesLength; i++) {
                        var primitive = primitives[i];
                        var indexAccessorId = primitive.indices;
                        var indexAccessor = accessors[indexAccessorId];

                        var indicesArray = readAccessor(indexAccessor, gltf);
                        indices.push(indicesArray);
                    }
                }
            }
            var copyIndices = [];
            var copyAccessors = copyGltf.accessors;
            var copyMeshes = copyGltf.meshes;
            for (var copyMeshId in copyMeshes) {
                if (copyMeshes.hasOwnProperty(copyMeshId)) {
                    var copyMesh = copyMeshes[copyMeshId];
                    var copyPrimitives = copyMesh.primitives;
                    var copyPrimitivesLength = copyPrimitives.length;
                    for (i = 0; i < copyPrimitivesLength; i++) {
                        var copyPrimitive = copyPrimitives[i];
                        var copyIndexAccessorId = copyPrimitive.indices;
                        var copyIndexAccessor = copyAccessors[indexAccessorId];

                        var copyIndicesArray = readAccessor(indexAccessor, gltf);
                        copyIndices.push(copyIndicesArray);

                    }
                }
            }
            expect(indices).not.toEqual(copyIndices);
            done();
            
        });
        
    });
});