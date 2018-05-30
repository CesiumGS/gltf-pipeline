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
 * @param {Object} dracoExtension A javascript object containing KHR_draco_mesh_compression.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(gltf, primitive, compressedData, dracoExtension) {
    var dracoGeometry = decompressDracoBuffer(compressedData);
    var numFaces = dracoGeometry.num_faces();
    var numPoints = dracoGeometry.num_points();

    // Add decompressed indices data to indices accessor.
    var indicesAccessorId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesAccessorId];
    indicesAccessor.count = numFaces * 3;

    var dracoAttributes = dracoExtension.attributes;
    for (var semantic in dracoAttributes) {
        if (dracoAttributes.hasOwnProperty(semantic)) {
            var gltfAttributeId = primitive.attributes[semantic];
            var attributeAccessor = gltf.accessors[gltfAttributeId];
            attributeAccessor.count = numPoints;
        }
    }

    decoderModule.destroy(dracoGeometry);
    return gltf;
}

function decompressDracoBuffer(compressedData) {
    var source = new Uint8Array(compressedData.buffer);
    var dracoBuffer = new decoderModule.DecoderBuffer();
    dracoBuffer.Init(source, source.length);

    var decoder = new decoderModule.Decoder();
    var geometryType = decoder.GetEncodedGeometryType(dracoBuffer);
    if (geometryType !== decoderModule.TRIANGULAR_MESH) {
        decoderModule.destroy(decoder);
        throw new RuntimeError('Compressed data is not a mesh.');
    }
    var dracoGeometry = new decoderModule.Mesh();
    var decodingStatus = decoder.DecodeBufferToMesh(dracoBuffer, dracoGeometry);
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
        decoderModule.destroy(decoder);
        throw new RuntimeError('Draco decoding failed: ' + decodingStatus.error_msg());
    }

    decoderModule.destroy(dracoBuffer);
    decoderModule.destroy(decoder);
    return dracoGeometry;
}

