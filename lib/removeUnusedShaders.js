'use strict';
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

    // Iterate through shaders and remove those that are not in the hash
    var numberOfShadersRemoved = 0;
    var shaders = gltf.shaders; 
    if (defined(shaders)) {
        var usedShaders = {};

        for (var shaderId in shaders) {
            if (shaders.hasOwnProperty(shaderId)) {
                // If this shader is in the hash, then keep it in the glTF asset
                if (defined(usedShaderIds[shaderId])) {
                    usedShaders[shaderId] = shaders[shaderId];
                } else {
                    ++numberOfShadersRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfShadersRemoved += numberOfShadersRemoved;
        }

        gltf.shaders = usedShaders;
    }

// TODO: remove orphan uris

    return gltf;
}