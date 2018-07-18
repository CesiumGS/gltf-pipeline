'use strict';

module.exports = getPrimitiveAttributeSemantics;

/**
 * Retrieves the primitive attributes that start with a given semantic prefix.
 * This is done because glTF attributes may exist in the form 'TEXCOORD_0', and allows
 * other functions to match against the root semantic, as well as finding multiple matching
 * semantics in cases where that is necessary.
 *
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {String} semanticPrefix The search string for semantics. Matched semantics start with this string.
 * @returns {Array.<string>} The primitive semantics starting with semanticPrefix.
 */
function getPrimitiveAttributeSemantics(primitive, semanticPrefix) {
    var attributes = primitive.attributes;
    var matchingSemantics = [];
    for (var attributeSemantic in attributes) {
        if (attributes.hasOwnProperty(attributeSemantic)) {
            if (attributeSemantic.indexOf(semanticPrefix) === 0) {
                matchingSemantics.push(attributeSemantic);
            }
        }
    }
    return matchingSemantics;
}
