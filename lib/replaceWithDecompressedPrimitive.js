'use strict';
var draco3d = require('draco3d');
var ForEach = require('./ForEach');

var decoderModule = draco3d.createDecoderModule({});

module.exports = replaceWithDecompressedPrimitive;

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
        var errorMsg = 'Compressed data is not a mesh.';
        console.error(errorMsg);
        decoderModule.destroy(decoder);
        throw new Error(errorMsg);
    }
    var dracoGeometry = new decoderModule.Mesh();
    var decodingStatus = decoder.DecodeBufferToMesh(dracoBuffer, dracoGeometry);
    if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
        var errorMsg = 'Draco decoding failed: ';
        errorMsg += decodingStatus.error_msg();
        console.error(errorMsg);
        decoderModule.destroy(decoder);
        throw new Error(errorMsg);
    }

    decoderModule.destroy(dracoBuffer);
    decoderModule.destroy(decoder);
    return dracoGeometry;
}

