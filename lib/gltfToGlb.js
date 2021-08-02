"use strict";
const Cesium = require("cesium");
const getJsonBufferPadded = require("./getJsonBufferPadded");
const processGltf = require("./processGltf");

const clone = Cesium.clone;
const defined = Cesium.defined;

module.exports = gltfToGlb;

/**
 * Convert a glTF to glb.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] The same options object as {@link processGltf}
 * @returns {Promise} A promise that resolves to an object containing the glb and a dictionary containing separate resources.
 */
function gltfToGlb(gltf, options) {
  options = defined(options) ? clone(options) : {};
  options.forceMergeBuffers = !options.separate;
  options.bufferStorage = {
    buffer: undefined,
  };

  return processGltf(gltf, options).then(function (results) {
    return {
      glb: getGlb(results.gltf, options.bufferStorage.buffer),
      separateResources: results.separateResources,
    };
  });
}

function getGlb(gltf, binaryBuffer) {
  const jsonBuffer = getJsonBufferPadded(gltf, 20);

  // Compute glb length: (Global header) + (JSON chunk header) + (JSON chunk) + [(Binary chunk header) + (Binary chunk)]
  let glbLength = 12 + 8 + jsonBuffer.length;

  if (defined(binaryBuffer)) {
    glbLength += 8 + binaryBuffer.length;
  }

  const glb = Buffer.alloc(glbLength);

  // Write binary glTF header (magic, version, length)
  let byteOffset = 0;
  glb.writeUInt32LE(0x46546c67, byteOffset);
  byteOffset += 4;
  glb.writeUInt32LE(2, byteOffset);
  byteOffset += 4;
  glb.writeUInt32LE(glbLength, byteOffset);
  byteOffset += 4;

  // Write JSON Chunk header (length, type)
  glb.writeUInt32LE(jsonBuffer.length, byteOffset);
  byteOffset += 4;
  glb.writeUInt32LE(0x4e4f534a, byteOffset); // JSON
  byteOffset += 4;

  // Write JSON Chunk
  jsonBuffer.copy(glb, byteOffset);
  byteOffset += jsonBuffer.length;

  if (defined(binaryBuffer)) {
    // Write Binary Chunk header (length, type)
    glb.writeUInt32LE(binaryBuffer.length, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(0x004e4942, byteOffset); // BIN
    byteOffset += 4;

    // Write Binary Chunk
    binaryBuffer.copy(glb, byteOffset);
  }

  return glb;
}
