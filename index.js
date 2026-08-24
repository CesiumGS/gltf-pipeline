/*eslint-disable n/global-require*/
"use strict";

const { removeExtension } = require("@gltf-pipeline/core");

module.exports = {
  getStatistics: require("@gltf-pipeline/lib"),
  glbToGltf: require("@gltf-pipeline/lib"),
  gltfToGlb: require("@gltf-pipeline/lib"),
  processGlb: require("@gltf-pipeline/lib"),
  processGltf: require("@gltf-pipeline/lib"),
  removeExtension: removeExtension,
};
