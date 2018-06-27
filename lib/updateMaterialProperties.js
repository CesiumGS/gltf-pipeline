'use strict';

var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');
var ForEach = require('./ForEach');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = updateMaterialProperties;

function isStateEnabled(renderStates, state) {
    return (renderStates.enable.indexOf(state) > -1);
}

/**
 * Move glTF 1.0 technique render states to glTF 2.0 materials properties and EXT_blend extension.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The updated glTF asset.
 *
 * @private
 */
function updateMaterialProperties(gltf) {
    var blendingForTechnique = {};
    var materialPropertiesForTechnique = {};
    var techniquesLegacy = gltf.techniques;
    if (!defined(techniquesLegacy)) {
        return gltf;
    }

    ForEach.technique(gltf, function (techniqueLegacy, techniqueIndex) {
        var renderStates = techniqueLegacy.states;
        if (defined(renderStates)) {
            var materialProperties = materialPropertiesForTechnique[techniqueIndex] = {};

            // If BLEND is enabled, the material should have alpha mode BLEND
            // and save the blend functions to the EXT_blend extension
            if (isStateEnabled(renderStates, WebGLConstants.BLEND)
                    || defined(renderStates.blendEquationSeparate) || defined(renderStates.blendFuncSeparate)) {
                materialProperties.alphaMode = 'BLEND';
                if (defined(renderStates.functions)) {
                    blendingForTechnique[techniqueIndex] = {
                        blendEquation: renderStates.functions.blendEquationSeparate,
                        blendFactors: renderStates.functions.blendFuncSeparate
                    };
                }
            }

            // If CULL_FACE is not enabled, the material should be doubleSided
            if (!isStateEnabled(renderStates, WebGLConstants.CULL_FACE)) {
                materialProperties.doubleSided = true;
            }

            delete techniqueLegacy.state;
        }
    });

    if (Object.keys(blendingForTechnique).length > 0) {
        if (!defined(gltf.extensions)) {
            gltf.extensions = {};
        }

        addExtensionsUsed(gltf, 'EXT_blend');
    }

    ForEach.material(gltf, function (material) {
        if (defined(material.technique)) {
            var materialProperties = materialPropertiesForTechnique[material.technique];
            ForEach.objectLegacy(materialProperties, function (value, property) {
                material[property] = value;
            });

            var blending = blendingForTechnique[material.technique];
            if (defined(blending)) {
                if (!defined(material.extensions)) {
                    material.extensions = {};
                }

                material.extensions.EXT_blend = blending;
            }
        }
    });

    return gltf;
}
