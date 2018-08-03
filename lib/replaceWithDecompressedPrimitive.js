'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');
var addBuffer = require('./addBuffer');

var RuntimeError = Cesium.RuntimeError;
var WebGLConstants = Cesium.WebGLConstants;

var decoderModule = draco3d.createDecoderModule({});

module.exports = replaceWithDecompressedPrimitive;

/**
 * Replace the accessor properties of the original primitive with the values from the decompressed primitive.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {Object} dracoEncodedBuffer A javascript object containing a Draco encoded mesh.
 * @param {Number} dracoEncodedBuffer.numberOfPoints Number of points after the mesh is decompressed.
 * @param {Number} dracoEncodedBuffer.numberOfFaces Number of faces after the mesh is decompressed.
 * @param {Buffer} dracoEncodedBuffer.buffer A Buffer object containing a Draco compressed mesh.
 * @param {Boolean} uncompressedFallback If set, replaces the original with the decompressed data.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(gltf, primitive, dracoEncodedBuffer, uncompressedFallback) {
    var decoder;
    var dracoGeometry;

    // Add decompressed indices data to indices accessor.
    var indicesAccessor = gltf.accessors[primitive.indices];
    indicesAccessor.count = dracoEncodedBuffer.numberOfFaces * 3;

    if (uncompressedFallback) {
        decoder = new decoderModule.Decoder();
        dracoGeometry = decompressDracoBuffer(decoder, dracoEncodedBuffer.buffer);

        var indicesBuffer = getIndicesBuffer(indicesAccessor, decoderModule, decoder, dracoGeometry, dracoEncodedBuffer.numberOfFaces);

        indicesAccessor.bufferView = addBuffer(gltf, indicesBuffer);
        indicesAccessor.byteOffset = 0;
    }

    var dracoAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (var semantic in dracoAttributes) {
        if (dracoAttributes.hasOwnProperty(semantic)) {
            var attributeAccessor = gltf.accessors[primitive.attributes[semantic]];
            attributeAccessor.count = dracoEncodedBuffer.numberOfPoints;

            if (uncompressedFallback) {
                var attributeId = decoder.GetAttributeByUniqueId(dracoGeometry, dracoAttributes[semantic]);
                var attributeBuffer = getAttributeBuffer(decoderModule, decoder, dracoGeometry, attributeId);

                attributeAccessor.bufferView = addBuffer(gltf, attributeBuffer);
                attributeAccessor.byteOffset = 0;
            }
        }
    }

    if (uncompressedFallback) {
        decoderModule.destroy(dracoGeometry);
        decoderModule.destroy(decoder);
    }

    return gltf;
}

function decompressDracoBuffer(decoder, compressedData) {
    var source = new Uint8Array(compressedData.buffer);
    var dracoBuffer = new decoderModule.DecoderBuffer();
    dracoBuffer.Init(source, source.length);

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
    return dracoGeometry;
}

function getIndicesBuffer(accessor, decoderModule, decoder, dracoGeometry, numFaces) {
    // Convert indices
    var numIndices = numFaces * 3;
    var indices;
    if (accessor.componentType === WebGLConstants.BYTE) {
        indices = new Int8Array(numIndices);
    } else if (accessor.componentType === WebGLConstants.UNSIGNED_BYTE) {
        indices = new Uint8Array(numIndices);
    } else if (accessor.componentType === WebGLConstants.SHORT) {
        indices = new Int16Array(numIndices);
    } else if (accessor.componentType === WebGLConstants.UNSIGNED_SHORT) {
        indices = new Uint16Array(numIndices);
    } else {
        indices = new Uint32Array(numIndices);
    }

    var ia = new decoderModule.DracoInt32Array();
    for (var i = 0; i < numFaces; ++i) {
        decoder.GetFaceFromMesh(dracoGeometry, i, ia);
        var index = i * 3;
        indices[index] = ia.GetValue(0);
        indices[index + 1] = ia.GetValue(1);
        indices[index + 2] = ia.GetValue(2);
    }

    decoderModule.destroy(ia);

    var indicesUint8Data = Buffer.from(indices.buffer);
    return indicesUint8Data;
}

function getAttributeBuffer(decoderModule, decoder, dracoGeometry, attribute) {
    var numComponents = attribute.num_components();
    var numPoints = dracoGeometry.num_points();
    var numValues = numPoints * numComponents;

    var attributeData;
    var attributeArray;
    if (attribute.data_type() === 1) {
        attributeData = new decoderModule.DracoInt8Array();
        if (!decoder.GetAttributeInt8ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Int8Array(attributeData.size());
    } else if (attribute.data_type() === 2) {
        attributeData = new decoderModule.DracoUInt8Array();
        if (!decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Uint8Array(attributeData.size());
    } else if (attribute.data_type() === 3) {
        attributeData = new decoderModule.DracoInt16Array();
        if (!decoder.GetAttributeInt16ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Int16Array(attributeData.size());
    } else if (attribute.data_type() === 4) {
        attributeData = new decoderModule.DracoUInt16Array();
        if (!decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Uint16Array(attributeData.size());
    } else if (attribute.data_type() === 6) {
        attributeData = new decoderModule.DracoUInt32Array();
        if (!decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Uint32Array(attributeData.size());
    } else if (attribute.data_type() === 5) {
        attributeData = new decoderModule.DracoInt32Array();
        if (!decoder.GetAttributeInt32ForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Int32Array(attributeData.size());
    } else {
        attributeData = new decoderModule.DracoFloat32Array();
        if (!decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData)) {
            throw new RuntimeError('Could not get attribute data for id:' + attribute.unique_id().toString());
        }
        attributeArray = new Float32Array(attributeData.size());
    }

    for (var i = 0; i < numValues; i++) {
        attributeArray[i] = attributeData.GetValue(i);
    }

    decoderModule.destroy(attributeData);
    var attributeBuffer = Buffer.from(attributeArray.buffer);
    return attributeBuffer;
}
