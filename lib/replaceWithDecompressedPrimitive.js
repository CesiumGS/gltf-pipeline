'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');

module.exports = replaceWithDecompressedPrimitive;

/**
 * Replace the accessor properties of the original primitive with the values from the decompressed primitive.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {Number} encodedPointsCount Number of points after the mesh is decompressed.
 * @param {Number} encodedFacesCount Number of faces after the mesh is decompressed.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(gltf, primitive, encodedPointsCount, encodedFacesCount) {
    // Add decompressed indices data to indices accessor.
    var indicesAccessorId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesAccessorId];
    indicesAccessor.count = encodedFacesCount * 3;

    var dracoAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (var semantic in dracoAttributes) {
        if (dracoAttributes.hasOwnProperty(semantic)) {
            var gltfAttributeId = primitive.attributes[semantic];
            var attributeAccessor = gltf.accessors[gltfAttributeId];
            attributeAccessor.count = encodedPointsCount;
        }
    }

    return gltf;
}
