'use strict';
module.exports = getBufferPadded;

/**
 * Pad the buffer to the next 4-byte boundary to ensure proper alignment for the section that follows.
 *
 * @param {Buffer} buffer The buffer.
 * @returns {Buffer} The padded buffer.
 *
 * @private
 */
function getBufferPadded(buffer) {
    const boundary = 4;
    const byteLength = buffer.length;
    const remainder = byteLength % boundary;
    if (remainder === 0) {
        return buffer;
    }
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    const emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}
