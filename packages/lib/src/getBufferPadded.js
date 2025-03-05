"use strict";
module.exports = getBufferPadded;

/**
 * Pad the buffer to the next 8-byte boundary to ensure proper alignment for the section that follows.
 * glTF only requires 4-byte alignment but some extensions like EXT_structural_metadata require 8-byte
 * alignment for some buffer views.
 *
 * @param {Buffer} buffer The buffer.
 * @returns {Buffer} The padded buffer.
 *
 * @private
 */
function getBufferPadded(buffer) {
  const boundary = 8;
  const byteLength = buffer.length;
  const remainder = byteLength % boundary;
  if (remainder === 0) {
    return buffer;
  }
  const padding = remainder === 0 ? 0 : boundary - remainder;
  const emptyBuffer = Buffer.alloc(padding);
  return Buffer.concat([buffer, emptyBuffer]);
}
