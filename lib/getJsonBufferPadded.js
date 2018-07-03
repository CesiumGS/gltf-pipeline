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
    var string = JSON.stringify(json);

    var boundary = 4;
    var byteLength = Buffer.byteLength(string);
    var remainder = byteLength % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var whitespace = '';
    for (var i = 0; i < padding; ++i) {
        whitespace += ' ';
    }
    string += whitespace;

    return Buffer.from(string);
}
