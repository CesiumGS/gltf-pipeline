'use strict';

module.exports = removeDuplicatePrimitives;

/**
 * Looks for repeated primitives in a glTF and removes them if they exist.
 * 
 * @param {Object} gltf - An object holding a glTF hierarchy
 */
function removeDuplicatePrimitives(gltf) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var seenPrimitives = [];
            for (var i = 0; i < primitives.length; i++) {
                var primitive = primitives[i];
                if (objectInArray(seenPrimitives, primitive)) {
                    // Delete the primitive
                    primitives.splice(i, 1);
                    i--;
                }
                else {
                    seenPrimitives.push(primitive);
                }
            }
        }
    }
}

function objectInArray(array, object) {
    var length = array.length;
    for (var i = 0; i < length; i++) {
        if (objectEquals(object, array[i])) {
            return true;
        }
    }
    return false;
}

function objectEquals(object1, object2) {
    if (typeof object1 !== 'object' || typeof object2 !== 'object') {
        return object1 === object2;
    }
    var keys1 = Object.keys(object1);
    var keys2 = Object.keys(object2);
    var keys1Length = keys1.length;
    var keys2Length = keys2.length;
    if (keys1Length === keys2Length) {
        for (var i = 0; i < keys1Length; i++) {
            var key = keys1[i];
            if (!object2.hasOwnProperty(key)) {
                return false;
            }
            if (!objectEquals(object1[key], object2[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}