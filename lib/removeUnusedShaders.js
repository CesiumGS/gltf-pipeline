'use strict';
var Cesium = require('cesium');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = removeUnusedShaders;

/**
 * Remove all unused shaders in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused shaders.
 */
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