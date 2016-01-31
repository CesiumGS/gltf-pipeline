'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedShaders;

function removeUnusedShaders(gltf, stats) {
    var usedShaderIds = {};
    var programs = gltf.programs;

    // Build hash of used shaders by iterating through programs
    if (defined(programs)) {
        for (var programId in programs) {
            if (programs.hasOwnProperty(programId)) {
                var fragId = programs[programId].fragmentShader;
                var vertId = programs[programId].vertexShader;
                usedShaderIds[fragId] = true;
                usedShaderIds[vertId] = true;
            }
        }
    }

// TODO: remove orphan uris

    return removeObject(gltf, 'shaders', usedShaderIds, stats);
}