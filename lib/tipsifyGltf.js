'use strict';
var readAccessor = require('./readAccessor');
var writeAccessor = require('./writeAccessor');
var Cesium = require('cesium');
var Tipsify = Cesium.Tipsify;

module.exports = tipsifyGltf;

function tipsifyGltf(gltf) {
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
                var indicesArray = readAccessor(gltf, indexAccessor);

                indicesArray.data = Tipsify.tipsify({
                    indices: indicesArray.data,
                    maximumIndex: undefined,
                    cacheSize: 24
                });
                writeAccessor(gltf, indexAccessor, indicesArray.data);
            }
        }
    }
}
