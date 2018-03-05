'use strict';
var Cesium = require('cesium');

var RuntimeError = Cesium.RuntimeError;

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
    var header = data.slice(0, 2);
    if (header.equals(Buffer.from([0x42, 0x4D]))) {
        return '.bmp';
    } else if (header.equals(Buffer.from([0x47, 0x49]))) {
        return '.gif';
    } else if (header.equals(Buffer.from([0xFF, 0xD8]))) {
        return '.jpg';
    } else if (header.equals(Buffer.from([0x89, 0x50]))) {
        return '.png';
    } else if (header.equals(Buffer.from([0xAB, 0x4B]))) {
        return '.ktx';
    } else if (header.equals(Buffer.from([0x48, 0x78]))) {
        return '.crn';
    }

    throw new RuntimeError('Image data does not have valid header');
}