"use strict";
const Cesium = require("cesium");
const removeExtensionsRequired = require("./removeExtensionsRequired");

const defined = Cesium.defined;

module.exports = removeExtensionsUsed;

/**
 * Removes an extension from gltf.extensionsUsed and gltf.extensionsRequired if it is present.
 *
 * @param {object} gltf A javascript object containing a glTF asset.
 * @param {string} extension The extension to remove.
 *
 * @private
 */
function removeExtensionsUsed(gltf, extension) {
  const extensionsUsed = gltf.extensionsUsed;
  if (defined(extensionsUsed)) {
    const index = extensionsUsed.indexOf(extension);
    if (index >= 0) {
      extensionsUsed.splice(index, 1);
    }
    removeExtensionsRequired(gltf, extension);
    if (extensionsUsed.length === 0) {
      delete gltf.extensionsUsed;
    }
  }
}
