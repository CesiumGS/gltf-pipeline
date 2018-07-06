'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');
var ForEach = require('./ForEach');
var addToArray = require('./addToArray');

var decoderModule = draco3d.createDecoderModule({});

module.exports = replaceWithDecompressedPrimitive;

/**
 * Replace the accessor properties of the original primitive with the values from the decompressed primitive.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {Object} dracoEncodedBuffer A javascript object containing a Draco encoded mesh.
 * @param {Number} [dracoEncodedBuffer.numberOfPoints] Number of points after the mesh is decompressed.
 * @param {Number} [dracoEncodedBuffer.numberOfFaces] Number of faces after the mesh is decompressed.
 * @param {Buffer} [dracoEncodedBuffer.buffer] A Buffer object containing a Draco compressed mesh.
 * @param {Boolean} fallback If set, replaces the original with the decompressed data.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(gltf, primitive, dracoEncodedBuffer, fallback) {
    var decoder;
    var dracoGeometry;

    // Add decompressed indices data to indices accessor.
    var indicesAccessor = gltf.accessors[primitive.indices];
    indicesAccessor.count = dracoEncodedBuffer.numberOfFaces * 3;

    if (fallback) {
        decoder = new decoderModule.Decoder();
        dracoGeometry = decompressDracoBuffer(decoder, dracoEncodedBuffer.buffer);

        var indicesBuffer = getIndicesBuffer(gltf, indicesAccessor, decoderModule, decoder, dracoGeometry, dracoEncodedBuffer.numberOfFaces);
        var bufferViewId = addBufferToGltf(gltf, indicesBuffer);

        indicesAccessor.bufferView = bufferViewId;
        indicesAccessor.byteOffset = 0;
    }

    var dracoAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (var semantic in dracoAttributes) {
        if (dracoAttributes.hasOwnProperty(semantic)) {
            var attributeAccessor = gltf.accessors[primitive.attributes[semantic]];
            attributeAccessor.count = dracoEncodedBuffer.numberOfPoints;

            if (fallback) {
                var attributeId = decoder.GetAttributeByUniqueId(dracoGeometry, dracoAttributes[semantic]);
                var attributeBuffer = getAttributeBuffer(gltf, decoderModule, decoder, dracoGeometry, attributeId);
                var bufferViewId = addBufferToGltf(gltf, attributeBuffer);

                attributeAccessor.bufferView = bufferViewId;
                attributeAccessor.byteOffset = 0;
            }
        }
    }

    if (fallback) {
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
    return dracoGeometry;
}

// TODO: Check if this function exits or think about making it public.
function addBufferToGltf(gltf, buffer) {
    var encodedLength = buffer.length;
    var buffer = {
        byteLength : encodedLength,
        extras : {
            _pipeline : {
                source : buffer
            }
        }
    };
    var bufferId = addToArray(gltf.buffers, buffer);
    var bufferView = {
        buffer : bufferId,
        byteOffset : 0,
        byteLength : encodedLength
    };
    var bufferViewId = addToArray(gltf.bufferViews, bufferView);
    return bufferViewId;
}

function getIndicesBuffer(gltf, accessor, decoderModule, decoder, dracoGeometry, numFaces) {
    // Convert indices
    var numIndices = numFaces * 3;
    var indices;
    if (accessor.componentType === 5120) {
        indices = new Int8Array(numIndices);
    } else if (accessor.componentType === 5121) {
        indices = new Uint8Array(numIndices);
    } else if (accessor.componentType === 5122) {
        indices = new Int16Array(numIndices);
    } else if (accessor.componentType === 5123) {
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

    var indicesUint8Data = new Buffer.from(indices.buffer);
    return indicesUint8Data;
}

function getAttributeBuffer(gltf, decoderModule, decoder, dracoGeometry, attribute) {
    var numComponents = attribute.num_components();
    var numPoints = dracoGeometry.num_points();
    var numValues = numPoints * numComponents;

    var attributeData;
    var attributeArray;
    if (attribute.data_type() === 1) {
        attributeData = new decoderModule.DracoInt8Array();
        var gotData = decoder.GetAttributeInt8ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Int8Array(attributeData.size());
    } else if (attribute.data_type() === 2) {
        attributeData = new decoderModule.DracoUInt8Array();
        var gotData = decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Uint8Array(attributeData.size());
    } else if (attribute.data_type() === 3) {
        attributeData = new decoderModule.DracoInt16Array();
        var gotData = decoder.GetAttributeInt16ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Int16Array(attributeData.size());
    } else if (attribute.data_type() === 4) {
        attributeData = new decoderModule.DracoUInt16Array();
        var gotData = decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Uint16Array(attributeData.size());
    } else if (attribute.data_type() === 6) {
        attributeData = new decoderModule.DracoUInt32Array();
        var gotData = decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Uint32Array(attributeData.size());
    } else if (attribute.data_type() === 5) {
        attributeData = new decoderModule.DracoInt32Array();
        var gotData = decoder.GetAttributeInt32ForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Int32Array(attributeData.size());
    } else {
        attributeData = new decoderModule.DracoFloat32Array();
        var gotData = decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);
        attributeArray = new Float32Array(attributeData.size());
    }

    for (var i = 0; i < numValues; i++) {
        attributeArray[i] = attributeData.GetValue(i);
    }

    decoderModule.destroy(attributeData);
    var attributeBuffer = new Buffer.from(attributeArray.buffer);
    return attributeBuffer;
}
