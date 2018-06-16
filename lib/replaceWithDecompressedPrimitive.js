'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');

var RuntimeError = Cesium.RuntimeError;

var decoderModule = draco3d.createDecoderModule({});

module.exports = replaceWithDecompressedPrimitive;

/**
 * Replace the accessor properties of the original primitive with the values from the decompressed primitive.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {Buffer} compressedData A Buffer object containing a Draco compressed mesh.
 * @param {Number} encodedPointsCount Number of points after the mesh is decompressed.
 * @param {Number} encodedFacesCount Number of faces after the mesh is decompressed.
 * @param {Object} dracoExtension A javascript object containing KHR_draco_mesh_compression.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(gltf, primitive, compressedData, encodedPointsCount, encodedFacesCount, dracoExtension) {
    // Add decompressed indices data to indices accessor.
    var indicesAccessorId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesAccessorId];
    indicesAccessor.count = encodedFacesCount * 3;

    var dracoAttributes = dracoExtension.attributes;
    for (var semantic in dracoAttributes) {
        if (dracoAttributes.hasOwnProperty(semantic)) {
            var gltfAttributeId = primitive.attributes[semantic];
            var attributeAccessor = gltf.accessors[gltfAttributeId];
            attributeAccessor.count = encodedPointsCount;
        }
    }

    return gltf;
}
