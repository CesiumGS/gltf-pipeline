'use strict';
const Cesium = require('cesium');
const draco3d = require('draco3d');
const addBuffer = require('./addBuffer');

const RuntimeError = Cesium.RuntimeError;
const WebGLConstants = Cesium.WebGLConstants;

const decoderModule = draco3d.createDecoderModule({});

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
    let decoder;
    let dracoGeometry;

    // Add decompressed indices data to indices accessor.
    const indicesAccessor = gltf.accessors[primitive.indices];
    indicesAccessor.count = dracoEncodedBuffer.numberOfFaces * 3;

    if (uncompressedFallback) {
        decoder = new decoderModule.Decoder();
        dracoGeometry = decompressDracoBuffer(decoder, dracoEncodedBuffer.buffer);

        const indicesBuffer = getIndicesBuffer(indicesAccessor, decoderModule, decoder, dracoGeometry, dracoEncodedBuffer.numberOfFaces);

        indicesAccessor.bufferView = addBuffer(gltf, indicesBuffer);
        indicesAccessor.byteOffset = 0;
    }

    const dracoAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (const semantic in dracoAttributes) {
        if (Object.prototype.hasOwnProperty.call(dracoAttributes, semantic)) {
            const attributeAccessor = gltf.accessors[primitive.attributes[semantic]];
            attributeAccessor.count = dracoEncodedBuffer.numberOfPoints;

            if (uncompressedFallback) {
                const attributeId = decoder.GetAttributeByUniqueId(dracoGeometry, dracoAttributes[semantic]);
                const attributeBuffer = getAttributeBuffer(decoderModule, decoder, dracoGeometry, attributeId);

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
    const source = new Uint8Array(compressedData.buffer);
    const dracoBuffer = new decoderModule.DecoderBuffer();
    dracoBuffer.Init(source, source.length);

    const geometryType = decoder.GetEncodedGeometryType(dracoBuffer);
    if (geometryType !== decoderModule.TRIANGULAR_MESH) {
        decoderModule.destroy(decoder);
        throw new RuntimeError('Compressed data is not a mesh.');
    }
    const dracoGeometry = new decoderModule.Mesh();
    const decodingStatus = decoder.DecodeBufferToMesh(dracoBuffer, dracoGeometry);
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
        decoderModule.destroy(decoder);
        throw new RuntimeError('Draco decoding failed: ' + decodingStatus.error_msg());
    }

    decoderModule.destroy(dracoBuffer);
    return dracoGeometry;
}

function getIndicesBuffer(accessor, decoderModule, decoder, dracoGeometry, numFaces) {
    // Convert indices
    const numIndices = numFaces * 3;
    let indices;
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

    const ia = new decoderModule.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
        decoder.GetFaceFromMesh(dracoGeometry, i, ia);
        const index = i * 3;
        indices[index] = ia.GetValue(0);
        indices[index + 1] = ia.GetValue(1);
        indices[index + 2] = ia.GetValue(2);
    }

    decoderModule.destroy(ia);

    const indicesUint8Data = Buffer.from(indices.buffer);
    return indicesUint8Data;
}

function getAttributeBuffer(decoderModule, decoder, dracoGeometry, attribute) {
    const numComponents = attribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    let attributeData;
    let attributeArray;
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

    for (let i = 0; i < numValues; i++) {
        attributeArray[i] = attributeData.GetValue(i);
    }

    decoderModule.destroy(attributeData);
    const attributeBuffer = Buffer.from(attributeArray.buffer);
    return attributeBuffer;
}
