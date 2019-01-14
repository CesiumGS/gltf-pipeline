'use strict';
const Cesium = require('cesium');
const defaultValue = Cesium.defaultValue;

module.exports = getImageWebp;

/**
 * Gets the WebP image object if the EXT_image_webp extension is defined.
 *
 * @param {Object} image The image object.
 * @returns {Object|undefined} The WebP image object, or undefined if it doesn't exist.
 *
 * @private
 */
function getImageWebp(image) {
    const extensions = defaultValue(image.extensions, defaultValue.EMPTY_OBJECT);
    return extensions.EXT_image_webp;
}
