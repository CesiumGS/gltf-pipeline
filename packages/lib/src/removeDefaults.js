"use strict";
const Cesium = require("cesium");
const { ForEach } = require("@gltf-pipeline/core");

const defined = Cesium.defined;
const Matrix4 = Cesium.Matrix4;

module.exports = removeDefaults;

/**
 * Remove default values from the glTF. Not exhaustive.
 *
 * @param {object} gltf A javascript object containing a glTF asset.
 * @returns {object} glTF with default values removed.
 *
 * @private
 */
function removeDefaults(gltf) {
  ForEach.node(gltf, function (node) {
    if (
      defined(node.matrix) &&
      Matrix4.equals(Matrix4.fromArray(node.matrix), Matrix4.IDENTITY)
    ) {
      delete node.matrix;
    }
  });
  ForEach.accessor(gltf, function (accessor) {
    if (accessor.normalized === false) {
      delete accessor.normalized;
    }
  });
  return gltf;
}
