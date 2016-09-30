'use strict';
var techniqueParameterForSemantic = require('./techniqueParameterForSemantic');
var techniqueAttributeForParameter = require('./techniqueAttributeForParameter');

module.exports = techniqueAttributeForSemantic;

function techniqueAttributeForSemantic(technique, semantic) {
    return techniqueAttributeForParameter(technique, techniqueParameterForSemantic(technique, semantic));
}