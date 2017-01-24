'use strict';
module.exports = techniqueAttributeForParameter;

/**
 * Retrieves the primitive attributes that has a given parameter name.
 *
 * @param {Object} technique A javascript object containing a glTF technique.
 * @param {String} parameterName The search string for parameter.
 * @returns {Array.<string>} The primitive attribute with matching paramerterName.
 */
function techniqueAttributeForParameter(technique, parameterName) {
    var attributes = technique.attributes;
    for (var attributeName in attributes) {
        if (attributes.hasOwnProperty(attributeName)) {
            var attribute = attributes[attributeName];
            if (attribute === parameterName) {
                return attributeName;
            }
        }
    }
}
