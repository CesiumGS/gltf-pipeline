"use strict";
const Cesium = require("cesium");
const addBuffer = require("./addBuffer");
const numberOfComponentsForType = require("./numberOfComponentsForType");

const defined = Cesium.defined;
const RuntimeError = Cesium.RuntimeError;
const WebGLConstants = Cesium.WebGLConstants;

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
 * @param {Object} quantizationBitsValues A javascript object containing quantization bits for the different attribute types.
 * @param {Object} decoderModule The draco decoder module.
 * @returns {Object} The glTF asset with the decompressed primitive.
 *
 * @private
 */
function replaceWithDecompressedPrimitive(
  gltf,
  primitive,
  dracoEncodedBuffer,
  uncompressedFallback,
  quantizationBitsValues,
  decoderModule
) {
  let decoder;
  let dracoGeometry;

  // Add decompressed indices data to indices accessor.
  const indicesAccessor = gltf.accessors[primitive.indices];
  indicesAccessor.count = dracoEncodedBuffer.numberOfFaces * 3;

  if (uncompressedFallback) {
    decoder = new decoderModule.Decoder();
    dracoGeometry = decompressDracoBuffer(
      decoderModule,
      decoder,
      dracoEncodedBuffer.buffer
    );

    const indicesBuffer = getIndicesBuffer(
      indicesAccessor,
      decoderModule,
      decoder,
      dracoGeometry,
      dracoEncodedBuffer.numberOfFaces
    );

    indicesAccessor.bufferView = addBuffer(gltf, indicesBuffer);
    indicesAccessor.byteOffset = 0;
  }

  const dracoAttributes =
    primitive.extensions.KHR_draco_mesh_compression.attributes;
  for (const semantic in dracoAttributes) {
    if (Object.prototype.hasOwnProperty.call(dracoAttributes, semantic)) {
      const attributeAccessor = gltf.accessors[primitive.attributes[semantic]];
      attributeAccessor.count = dracoEncodedBuffer.numberOfPoints;

      if (uncompressedFallback) {
        const attributeId = decoder.GetAttributeByUniqueId(
          dracoGeometry,
          dracoAttributes[semantic]
        );
        const bufferObject = getAttributeBuffer(
          decoderModule,
          decoder,
          dracoGeometry,
          attributeId
        );
        attributeAccessor.min = bufferObject.minValues;
        attributeAccessor.max = bufferObject.maxValues;

        attributeAccessor.bufferView = addBuffer(
          gltf,
          bufferObject.attributeBuffer
        );
        attributeAccessor.byteOffset = 0;
      } else if (
        defined(attributeAccessor.min) &&
        defined(attributeAccessor.max)
      ) {
        const minmax = calculateQuantizedMinMax(
          semantic,
          attributeAccessor,
          quantizationBitsValues
        );
        attributeAccessor.min = minmax.min;
        attributeAccessor.max = minmax.max;
      }
    }
  }

  if (uncompressedFallback) {
    decoderModule.destroy(dracoGeometry);
    decoderModule.destroy(decoder);
  }

  return gltf;
}

function decompressDracoBuffer(decoderModule, decoder, compressedData) {
  const source = new Uint8Array(compressedData.buffer);
  const dracoBuffer = new decoderModule.DecoderBuffer();
  dracoBuffer.Init(source, source.length);

  const geometryType = decoder.GetEncodedGeometryType(dracoBuffer);
  if (geometryType !== decoderModule.TRIANGULAR_MESH) {
    decoderModule.destroy(decoder);
    throw new RuntimeError("Compressed data is not a mesh.");
  }
  const dracoGeometry = new decoderModule.Mesh();
  const decodingStatus = decoder.DecodeBufferToMesh(dracoBuffer, dracoGeometry);
  if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
    decoderModule.destroy(decoder);
    throw new RuntimeError(
      `Draco decoding failed: ${decodingStatus.error_msg()}`
    );
  }

  decoderModule.destroy(dracoBuffer);
  return dracoGeometry;
}

function getIndicesBuffer(
  accessor,
  decoderModule,
  decoder,
  dracoGeometry,
  numFaces
) {
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

  let attributeData;
  let attributeArray;
  if (attribute.data_type() === 1) {
    attributeData = new decoderModule.DracoInt8Array();
    if (
      !decoder.GetAttributeInt8ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Int8Array(attributeData.size());
  } else if (attribute.data_type() === 2) {
    attributeData = new decoderModule.DracoUInt8Array();
    if (
      !decoder.GetAttributeUInt8ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Uint8Array(attributeData.size());
  } else if (attribute.data_type() === 3) {
    attributeData = new decoderModule.DracoInt16Array();
    if (
      !decoder.GetAttributeInt16ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Int16Array(attributeData.size());
  } else if (attribute.data_type() === 4) {
    attributeData = new decoderModule.DracoUInt16Array();
    if (
      !decoder.GetAttributeUInt16ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Uint16Array(attributeData.size());
  } else if (attribute.data_type() === 6) {
    attributeData = new decoderModule.DracoUInt32Array();
    if (
      !decoder.GetAttributeUInt32ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Uint32Array(attributeData.size());
  } else if (attribute.data_type() === 5) {
    attributeData = new decoderModule.DracoInt32Array();
    if (
      !decoder.GetAttributeInt32ForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Int32Array(attributeData.size());
  } else {
    attributeData = new decoderModule.DracoFloat32Array();
    if (
      !decoder.GetAttributeFloatForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      )
    ) {
      throw new RuntimeError(
        `Could not get attribute data for id:${attribute
          .unique_id()
          .toString()}`
      );
    }
    attributeArray = new Float32Array(attributeData.size());
  }

  // Initialize min and max arrays.
  const minValues = [];
  const maxValues = [];
  for (let c = 0; c < numComponents; c++) {
    minValues.push(Number.POSITIVE_INFINITY);
    maxValues.push(Number.NEGATIVE_INFINITY);
  }

  for (let p = 0; p < numPoints; p++) {
    for (let c = 0; c < numComponents; c++) {
      const index = p * numComponents + c;
      attributeArray[index] = attributeData.GetValue(index);
      minValues[c] = Math.min(attributeArray[index], minValues[c]);
      maxValues[c] = Math.max(attributeArray[index], maxValues[c]);
    }
  }

  decoderModule.destroy(attributeData);
  const attributeBuffer = Buffer.from(attributeArray.buffer);
  return {
    attributeBuffer: attributeBuffer,
    minValues: minValues,
    maxValues: maxValues,
  };
}

function calculateQuantizedMinMax(
  semantic,
  attributeAccessor,
  quantizationBitsValues
) {
  const numberOfComponents = numberOfComponentsForType(attributeAccessor.type);

  let range = 0.0;
  for (let c = 0; c < numberOfComponents; ++c) {
    const dif = attributeAccessor.max[c] - attributeAccessor.min[c];
    if (dif > range) {
      range = dif;
    }
  }
  if (range === 0.0) {
    range = 1.0;
  }

  let attributeName = semantic;
  if (semantic.indexOf("_") > 0) {
    // Skip user-defined semantics prefixed with underscore
    attributeName = attributeName.substring(0, semantic.indexOf("_"));
  }
  if (
    attributeName !== "POSITION" &&
    attributeName !== "NORMAL" &&
    attributeName !== "COLOR" &&
    attributeName !== "TEXCOORD"
  ) {
    attributeName = "GENERIC";
  }
  const quantizationBits = quantizationBitsValues[attributeName];
  const maxQuantizedValue = (1 << quantizationBits) - 1;
  const inverseDelta = maxQuantizedValue / range;

  const quantizedMin = Array(numberOfComponents).fill(0);
  const quantizedMax = Array(numberOfComponents).fill(0);
  for (let c = 0; c < numberOfComponents; ++c) {
    const valueMin = attributeAccessor.min[c] - attributeAccessor.min[c];
    const valueMax = attributeAccessor.max[c] - attributeAccessor.min[c];

    const quantizedValueMin = Math.floor(valueMin * inverseDelta + 0.5);
    const quantizedValueMax = Math.floor(valueMax * inverseDelta + 0.5);

    // Update the extents by 1, which should get around any rounding issues.
    quantizedMin[c] = quantizedValueMin - 1;
    quantizedMax[c] = quantizedValueMax + 1;
  }

  const delta = range / maxQuantizedValue;

  const dequantizedMin = Array(numberOfComponents).fill(0);
  const dequantizedMax = Array(numberOfComponents).fill(0);
  for (let c = 0; c < numberOfComponents; ++c) {
    dequantizedMin[c] = quantizedMin[c] * delta + attributeAccessor.min[c];
    dequantizedMax[c] = quantizedMax[c] * delta + attributeAccessor.min[c];

    // Round to the nearest integer.
    if (attributeAccessor.componentType !== WebGLConstants.FLOAT) {
      dequantizedMin[c] = Math.ceil(dequantizedMin[c] - 0.5);
      dequantizedMax[c] = Math.floor(dequantizedMax[c] + 0.5);
    }
  }

  return {
    min: dequantizedMin,
    max: dequantizedMax,
  };
}
