/*eslint-disable global-require*/
"use strict";
module.exports = {
  getStatistics: require("./lib/getStatistics"),
  glbToGltf: require("./lib/glbToGltf"),
  gltfToGlb: require("./lib/gltfToGlb"),
  processGlb: require("./lib/processGlb"),
  processGltf: require("./lib/processGltf"),
  removeExtension: require("./lib/removeExtension"),
};
