"use strict";
const Cesium = require("cesium");

const defaultValue = Cesium.defaultValue;

module.exports = getJsonBufferPadded;

/**
 * Convert the JSON object to a padded buffer.
 *
 * Pad the JSON with extra whitespace to fit the next 8-byte boundary. This ensures proper alignment
 * for the section that follows. glTF only requires 4-byte alignment but some extensions like
 * EXT_structural_metadata require 8-byte alignment for some buffer views.
 *
 * @param {Object} json The JSON object.
 * @param {Number} [byteOffset=0] The byte offset on which the buffer starts.
 * @returns {Buffer} The padded JSON buffer.
 *
 * @private
 */
function getJsonBufferPadded(json, byteOffset) {
  byteOffset = defaultValue(byteOffset, 0);
  let string = JSON.stringify(json);

  const boundary = 8;
  const byteLength = Buffer.byteLength(string);
  const remainder = (byteOffset + byteLength) % boundary;
  const padding = remainder === 0 ? 0 : boundary - remainder;
  let whitespace = "";
  for (let i = 0; i < padding; ++i) {
    whitespace += " ";
  }
  string += whitespace;

  return Buffer.from(string);
}
