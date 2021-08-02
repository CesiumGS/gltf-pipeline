"use strict";
const Cesium = require("cesium");

const RuntimeError = Cesium.RuntimeError;

module.exports = getImageExtension;

/**
 * Get the image extension from a Buffer containing image data.
 *
 * @param {Buffer} data The image data.
 * @returns {String} The image extension.
 *
 * @private
 */
function getImageExtension(data) {
  const header = data.slice(0, 2);
  const webpHeaderRIFFChars = data.slice(0, 4);
  const webpHeaderWEBPChars = data.slice(8, 12);

  if (header.equals(Buffer.from([0x42, 0x4d]))) {
    return ".bmp";
  } else if (header.equals(Buffer.from([0x47, 0x49]))) {
    return ".gif";
  } else if (header.equals(Buffer.from([0xff, 0xd8]))) {
    return ".jpg";
  } else if (header.equals(Buffer.from([0x89, 0x50]))) {
    return ".png";
  } else if (header.equals(Buffer.from([0xab, 0x4b]))) {
    return ".ktx2";
  } else if (header.equals(Buffer.from([0x73, 0x42]))) {
    return ".basis";
  } else if (
    webpHeaderRIFFChars.equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
    webpHeaderWEBPChars.equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))
  ) {
    // See https://developers.google.com/speed/webp/docs/riff_container#webp_file_header
    return ".webp";
  }

  throw new RuntimeError("Image data does not have valid header");
}
