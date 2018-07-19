'use strict';

var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');
var addExtensionsRequired = require('./addExtensionsRequired');
var addToArray = require('./addToArray');
var ForEach = require('./ForEach');

var defined = Cesium.defined;

module.exports = moveTechniquesToExtension;

/**
 * Move glTF 1.0 material techniques to glTF 2.0 KHR_techniques_webgl extension.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The updated glTF asset.
 *
 * @private
 */
function moveTechniquesToExtension(gltf) {
    var techniquesLegacy = gltf.techniques;
    var mappedUniforms = {};
    var updatedTechniqueIndices = {};
    if (defined(techniquesLegacy)) {
        var extension = {
            programs: [],
            shaders: [],
            techniques: []
        };

        ForEach.technique(gltf, function (techniqueLegacy, techniqueIndex) {
            var technique = {
                name: techniqueLegacy.name,
                program: undefined,
                attributes: {},
                uniforms: {}
            };

            var parameterLegacy;
            ForEach.techniqueAttribute(techniqueLegacy, function (parameterName, attributeName) {
                parameterLegacy = techniqueLegacy.parameters[parameterName];
                technique.attributes[attributeName] = {
                    semantic: parameterLegacy.semantic
                };
            });

            ForEach.techniqueUniform(techniqueLegacy, function (parameterName, uniformName) {
                parameterLegacy = techniqueLegacy.parameters[parameterName];
                technique.uniforms[uniformName] = {
                    count: parameterLegacy.count,
                    node: parameterLegacy.node,
                    type: parameterLegacy.type,
                    semantic: parameterLegacy.semantic,
                    value: parameterLegacy.value
                };

                // Store the name of the uniform to update material values.
                mappedUniforms[parameterName] = uniformName;
            });

            var programLegacy = gltf.programs[techniqueLegacy.program];
            var program = {
                name: programLegacy.name,
                fragmentShader: undefined,
                vertexShader: undefined
            };

            var fs = gltf.shaders[programLegacy.fragmentShader];
            program.fragmentShader = addToArray(extension.shaders, fs, true);

            var vs = gltf.shaders[programLegacy.vertexShader];
            program.vertexShader = addToArray(extension.shaders, vs, true);

            technique.program = addToArray(extension.programs, program);

            // Store the index of the new technique to reference instead.
            updatedTechniqueIndices[techniqueIndex] = addToArray(extension.techniques, technique);
        });

        if (extension.techniques.length > 0) {
            if (!defined(gltf.extensions)) {
                gltf.extensions = {};
            }

            gltf.extensions.KHR_techniques_webgl = extension;
            addExtensionsUsed(gltf, 'KHR_techniques_webgl');
            addExtensionsRequired(gltf, 'KHR_techniques_webgl');
        }
    }

    ForEach.material(gltf, function (material) {
        if (defined(material.technique)) {
            var materialExtension = {
                technique: updatedTechniqueIndices[material.technique]
            };

            ForEach.objectLegacy(material.values, function (value, parameterName) {
                if (!defined(materialExtension.values)) {
                    materialExtension.values = {};
                }

                var uniformName = mappedUniforms[parameterName];
                materialExtension.values[uniformName] = value;
            });

            if (!defined(material.extensions)) {
                material.extensions = {};
            }

            material.extensions.KHR_techniques_webgl = materialExtension;
        }

        delete material.technique;
        delete material.values;
    });

    delete gltf.techniques;
    delete gltf.programs;
    delete gltf.shaders;

    return gltf;
}