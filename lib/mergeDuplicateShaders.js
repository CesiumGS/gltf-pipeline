'use strict';
var Cesium = require('cesium');
var bufferEqual = require('buffer-equal');

var defined = Cesium.defined;

var removeUnusedShaders = require('./removeUnusedShaders');

module.exports = mergeDuplicateShaders;

function mergeDuplicateShaders(gltf) {
    var shaders = gltf.shaders;
    var shaderIds = Object.keys(shaders);
    var shaderIdsLength = shaderIds.length;
    var shaderIdMapping = {};
    var uniqueShadersByType = {};
    for (var i = 0; i < shaderIdsLength; i++) {
        var shaderId = shaderIds[i];
        var shader = shaders[shaderId];
        var type = shader.type;
        var uniqueShaders = uniqueShadersByType[type];
        if (!defined(uniqueShaders)) {
            uniqueShaders = [];
            uniqueShadersByType[type] = uniqueShaders;
        }
        var uniqueShadersLength = uniqueShaders.length;
        var unique = true;
        for (var j = 0; j < uniqueShadersLength; j++) {
            var uniqueShaderId = uniqueShaders[j];
            var uniqueShader = shaders[uniqueShaderId];
            if (shaderEquals(shader, uniqueShader)) {
                shaderIdMapping[shaderId] = uniqueShaderId;
                unique = false;
                break;
            }
        }
        if (unique) {
            uniqueShaders.push(shaderId);
        }
    }
    remapShaders(gltf, shaderIdMapping);
    removeUnusedShaders(gltf);
}

function remapShaders(gltf, shaderIdMapping) {
    var programs = gltf.programs;
    for (var programId in programs) {
        if (programs.hasOwnProperty(programId)) {
            var program = programs[programId];
            var fragmentShaderId = program.fragmentShader;
            var vertexShaderId = program.vertexShader;
            var mappedFragmentShaderId = shaderIdMapping[fragmentShaderId];
            var mappedVertexShaderId = shaderIdMapping[vertexShaderId];
            if (defined(mappedFragmentShaderId)) {
                program.fragmentShader = mappedFragmentShaderId;
            }
            if (defined(mappedVertexShaderId)) {
                program.vertexShader = mappedVertexShaderId;
            }
        }
    }
}

function shaderEquals(shaderOne, shaderTwo) {
    if (shaderOne.type !== shaderTwo.type) {
        return false;
    }
    return bufferEqual(shaderOne.extras._pipeline.source, shaderTwo.extras._pipeline.source);
}