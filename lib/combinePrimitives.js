'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
module.exports = combinePrimitives;

function combinePrimitives(gltf) {
    var meshes = gltf.meshes;

    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                var mesh = meshes[meshId];

                var primitives = mesh.primitives;
                if (defined(primitives)) {
                    combineMeshPrimitives(primitives);
                }
            }
        }
    }

    return gltf;
}

//Combines the primitives for a given mesh
function combineMeshPrimitives(primitives) {

}


//Checks if primitives a and b can be combined based on their accessors, bufferViews, and buffers
function readyToCombine(a, b) {

}