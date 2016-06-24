'use strict';

module.exports = getAccessorsForSemantic;

/**
 * Iterates over the provided glTF meshes and calls the callback when a primitive is
 * found that uses a particular semantic.
 *
 * @param {Object} gltf The glTF hierarchy
 * @param {String} semantic Matches against the beginning of the semantic string for the primitives' attributes
 * @param {Function} callback This gets called when a match is found with the arguments (gltf, primitive, matchedSemantic, accessorId)
 * @param {Function} callback This gets called when the iteration completes
 */
function getAccessorsForSemantic(gltf, semantic, callback, done) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var primitiveAttributes = primitive.attributes;
                for (var attributeSemantic in primitiveAttributes) {
                    if (primitiveAttributes.hasOwnProperty(attributeSemantic)) {
                        if (attributeSemantic.indexOf(semantic) === 0) {
                            callback(gltf, primitive, primitiveAttributes[attributeSemantic], attributeSemantic);
                        }
                    }
                }
            }
        }
    }
    done();
}