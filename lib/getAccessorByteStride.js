'use strict';
var byteLengthForComponentType = require('./byteLengthForComponentType');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = getAccessorByteStride;

/**
 * Returns the byte stride of the provided accessor.
 * If the byteStride is 0, it is calculated based on type and componentType
 *
 * @param {Object} accessor The accessor.
 * @returns {Number} The byte stride of the accessor.
 */
function getAccessorByteStride(accessor) {
    if (accessor.byteStride > 0) {
        return accessor.byteStride;
    }
    return byteLengthForComponentType(accessor.componentType) * numberOfComponentsForType(accessor.type);
}
