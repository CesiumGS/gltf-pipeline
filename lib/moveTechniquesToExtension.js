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
    if (defined(techniquesLegacy)) {
        var extension = {
            programs: [],
            shaders: [],
            techniques: []
        };

        ForEach.techniqueLegacy(gltf, function (techniqueLegacy) {
            if (defined(techniqueLegacy.program)) {
                var technique = {
                    name: techniqueLegacy.name,
                    program: undefined,
                    attributes: {},
                    uniforms: {}
                };

                var parameter;
                ForEach.techniqueAttribute(techniqueLegacy, function (attribute, attributeSemantic) {
                    parameter = techniqueLegacy.parameters[attribute];
                    technique.attributes[attributeSemantic] = {
                        semantic: parameter.semantic
                    };
                });

                ForEach.techniqueUniform(techniqueLegacy, function (uniform, uniformSemantic) {
                    parameter = techniqueLegacy.parameters[uniform];
                    technique.uniforms[uniformSemantic] = {
                        count: parameter.count,
                        node: parameter.node,
                        type: parameter.type,
                        semantic: parameter.semantic,
                        value: parameter.value
                    };

                    parameter.uniformName = uniformSemantic;
                });

                var programLegacy = gltf.programs[techniqueLegacy.program];
                var program = {
                    name: programLegacy.name,
                    fragmentShader: undefined,
                    vertexShader: undefined
                };

                var fs = gltf.shaders[programLegacy.fragmentShader];
                program.fragmentShader = addToArray(extension.shaders, fs);

                var vs = gltf.shaders[programLegacy.vertexShader];
                program.vertexShader = addToArray(extension.shaders, vs);

                technique.program = addToArray(extension.programs, program);

                // Legacy technique object will be deleted.
                // Have it hold the index of the new technique to reference instead.
                techniqueLegacy.updatedReference = addToArray(extension.techniques, technique);
            }
        });

        if (extension.techniques.length > 0) {
            if (!defined(gltf.extensions)) {
                gltf.extensions = {};
            }

            gltf.extensions['KHR_techniques_webgl'] = extension;
            addExtensionsUsed(gltf, 'KHR_techniques_webgl');
            addExtensionsRequired(gltf, 'KHR_techniques_webgl');
        }
    }

    ForEach.material(gltf, function (material) {
        if (defined(material.technique)) {
            var materialTechniqueLegacy = gltf.techniques[material.technique];
            var materialExtension = {
                technique: materialTechniqueLegacy.updatedReference
            };

            ForEach.objectLegacy(material.values, function (value, parameter) {
                if (!defined(materialExtension.values)) {
                    materialExtension.values = {};
                }

                var uniform = materialTechniqueLegacy.parameters[parameter].uniformName;
                materialExtension.values[uniform] = value;
            });

            if (!defined(material.extensions)) {
                material.extensions = {};
            }

            material.extensions['KHR_techniques_webgl'] = materialExtension;
        }

        delete material.technique;
        delete material.values;
    });

    delete gltf.techniques;
    delete gltf.programs;
    delete gltf.shaders;

    return gltf;
}