'use strict';
module.exports = getJsonBufferPadded;

/**
 * Convert the JSON object to a padded buffer.
 *
 * Pad the JSON with extra whitespace to fit the next 4-byte boundary. This ensures proper alignment
 * for the section that follows.
 *
 * @param {Object} [json] The JSON object.
 * @returns {Buffer} The padded JSON buffer.
 *
 * @private
 */
function getJsonBufferPadded(json) {
    let string = JSON.stringify(json);

    const boundary = 4;
    const byteLength = Buffer.byteLength(string);
    const remainder = byteLength % boundary;
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    let whitespace = '';
    for (let i = 0; i < padding; ++i) {
        whitespace += ' ';
    }
    string += whitespace;

    return Buffer.from(string);
}
