'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedPrograms;

function removeUnusedPrograms(gltf, stats) {
    var usedProgramIds = {};
    var techniques = gltf.techniques;

    // Build hash of used programs by iterating through techniques
    if (defined(techniques)) {
        for (var techniqueId in techniques) {
            if (techniques.hasOwnProperty(techniqueId)) {
                var id = techniques[techniqueId].program;
                usedProgramIds[id] = true;
            }
        }
    }

    // Iterate through programs and remove those that are not in the hash
    var numberOfProgramsRemoved = 0;
    var programs = gltf.programs;
    if (defined(programs)) {
        var usedPrograms = {};

        for (var programId in programs) {
            if (programs.hasOwnProperty(programId)) {
                // If this program is in the hash, then keep it in the glTF asset
                if (defined(usedProgramIds[programId])) {
                    usedPrograms[programId] = programs[programId];
                } else {
                    ++numberOfProgramsRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfProgramsRemoved += numberOfProgramsRemoved;
        }

        gltf.programs = usedPrograms;
    }

// TODO: remove orphan uris

    return gltf;
}