'use strict';

var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');
var ForEach = require('./ForEach');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = moveBlendingToExtension;

var defaultBlendEquation = [
    WebGLConstants.FUNC_ADD,
    WebGLConstants.FUNC_ADD
];

var defaultBlendFactors = [
    WebGLConstants.ONE,
    WebGLConstants.ZERO,
    WebGLConstants.ONE,
    WebGLConstants.ZERO
];

/**
 * Move glTF 1.0 techniques render states to glTF 2.0 EXT_blend extension.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The updated glTF asset.
 *
 * @private
 */
function moveBlendingToExtension(gltf) {
    var techniqueBlending = {};
    var techniquesLegacy = gltf.techniques;
    if (!defined(techniquesLegacy)) {
        return gltf;
    }

    ForEach.techniqueLegacy(gltf, function (techniqueLegacy, techniqueIndex) {
        var renderStates = techniqueLegacy.states;
        if (defined(renderStates)) {
            if (renderStates.enable.indexOf(WebGLConstants.BLEND) > -1 ||
                    defined(renderStates.blendEquationSeparate) || defined(renderStates.blendFuncSeparate)) {
                techniqueBlending[techniqueIndex] = {
                    blendEquation: defaultValue(renderStates.functions.blendEquationSeparate, defaultBlendEquation),
                    blendFactors: defaultValue(renderStates.functions.blendFuncSeparate, defaultBlendFactors)
                };
            }

            delete techniqueLegacy.state;
        }
    });

    if (Object.keys(techniqueBlending).length === 0) {
        return gltf;
    }

    if (!defined(gltf.extensions)) {
        gltf.extensions = {};
    }

    addExtensionsUsed(gltf, 'EXT_blend');

    ForEach.material(gltf, function (material) {
        if (defined(material.technique)) {
            var blending = techniqueBlending[material.technique];
            if (defined(blending)) {
                if (!defined(material.extensions)) {
                    material.extensions = {};
                }

                material.extensions['EXT_blend'] = blending;
            }
        }
    });

    return gltf;
}
