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
    var boundary = 4;
    var byteLength = buffer.length;
    var remainder = byteLength % boundary;
    if (remainder === 0) {
        return buffer;
    }
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}
