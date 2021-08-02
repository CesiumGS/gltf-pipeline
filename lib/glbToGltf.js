"use strict";
const parseGlb = require("./parseGlb");
const processGltf = require("./processGltf");

module.exports = glbToGltf;

/**
 * Convert a glb to glTF.
 *
 * @param {Buffer} glb A buffer containing the glb contents.
 * @param {Object} [options] The same options object as {@link processGltf}
 * @returns {Promise} A promise that resolves to an object containing the glTF and a dictionary containing separate resources.
 */
function glbToGltf(glb, options) {
  const gltf = parseGlb(glb);
  return processGltf(gltf, options);
}
