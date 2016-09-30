'use strict';
module.exports = techniqueAttributeForParameter;

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
