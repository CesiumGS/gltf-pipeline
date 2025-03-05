/*eslint-disable n/global-require*/
"use strict";

const { removeExtension } = require("@gltf-pipeline/core");

module.exports = {
  compressDracoMeshes: require("./src/compressDracoMeshes"),
  dataUriToBuffer: require("./src/dataUriToBuffer"),
  FileUrl: require("./src/FileUrl"),
  getBufferPadded: require("./src/getBufferPadded"),
  getImageExtension: require("./src/getImageExtension"),
  getJsonBufferPadded: require("./src/getJsonBufferPadded"),
  getStatistics: require("./src/getStatistics"),
  glbToGltf: require("./src/glbToGltf"),
  gltfToGlb: require("./src/gltfToGlb"),
  mergeBuffers: require("./src/mergeBuffers"),
  processGlb: require("./src/processGlb"),
  processGltf: require("./src/processGltf"),
  readResources: require("./src/readResources"),
  removeDefaults: require("./src/removeDefaults"),
  replaceWithDecompressedPrimitive: require("./src/replaceWithDecompressedPrimitive"),
  splitPrimitives: require("./src/splitPrimitives"),
  writeResources: require("./src/writeResources"),
  removeExtension: removeExtension,
};
