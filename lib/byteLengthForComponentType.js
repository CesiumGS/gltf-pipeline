'use strict';

module.exports = byteLengthForComponentType;

/**
 * Utility function for retrieving the byte length of a component type.
 * As per the spec:
 *     5120 (BYTE)           : 1
 *     5121 (UNSIGNED_BYTE)  : 1
 *     5122 (SHORT)          : 2
 *     5123 (UNSIGNED_SHORT) : 2
 *     5126 (FLOAT)          : 4
 *
 * @param {Number} [componentType]
 * @returns {Number} The byte length of the component type.
 */
function byteLengthForComponentType(componentType) {
    switch (componentType) {
        case 5120:
        case 5121:
            return 1;
        case 5122:
        case 5123:
            return 2;
        case 5126:
            return 4;
    }
}