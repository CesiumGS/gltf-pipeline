'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

module.exports = patchMaterialsForBatchId;

function patchMaterialsForBatchId(gltf) {
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    var programs = gltf.programs;
    var shaders = gltf.shaders;
    var doneTechniques = {};
    var donePrograms = {};
    var doneShaders = {};
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var techniqueId = material.technique;
            if (!defined(doneTechniques[techniqueId])) {
                var technique = techniques[techniqueId];
                patchTechniqueForBatchId(technique);
                doneTechniques[techniqueId] = true;

                var programId = technique.program;
                if (!defined(donePrograms[programId])) {
                    var program = programs[programId];
                    patchProgramForBatchId(program);
                    donePrograms[programId] = true;

                    var vertexShaderId = program.vertexShader;
                    if (!defined(doneShaders[vertexShaderId])) {
                        var vertexShader = shaders[vertexShaderId];
                        patchVertexShaderForBatchId(vertexShader);
                        doneShaders[vertexShaderId] = true;
                    }
                }
            }
        }
    }
}

function patchTechniqueForBatchId(technique) {
    var attributes = technique.attributes;
    if (!defined(attributes.a_batchId)) {
        attributes.a_batchId = 'batchId';
    }
    var parameters = technique.parameters;
    if (!defined(parameters.batchId)) {
        parameters.batchId = {
            semantic : 'BATCHID',
            type : WebGLConstants.FLOAT
        };
    }
}

function patchProgramForBatchId(program) {
    var attributes = program.attributes;
    if (attributes.indexOf('a_batchId') < 0) {
        attributes.push('a_batchId');
    }
}

function patchVertexShaderForBatchId(vertexShader) {
    var shaderBuffer = vertexShader.extras._pipeline.source;
    var shaderText = shaderBuffer.toString('utf8');
    if (shaderText.indexOf('a_batchId') < 0) {
        shaderText = 'attribute float a_batchId;\n' + shaderText;
        vertexShader.extras._pipeline.source = new Buffer(shaderText, 'utf8');
    }
}

