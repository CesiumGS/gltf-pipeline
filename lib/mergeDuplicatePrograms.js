'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var deepEqual = require('deep-equal');
var removeUnusedPrograms = require('./removeUnusedProperties').removeUnusedPrograms;

var defined = Cesium.defined;

module.exports = mergeDuplicatePrograms;

function mergeDuplicatePrograms(gltf) {
    var programs = gltf.programs;
    var programIdMapping = {};
    var uniquePrograms = [];
    for (var programId in programs) {
        if (programs.hasOwnProperty(programId)) {
            var program = clone(programs[programId]);
            delete program.name;
            delete program.extras;
            var uniqueProgramsLength = uniquePrograms.length;
            var unique = true;
            for (var i = 0; i < uniqueProgramsLength; i++) {
                var uniqueProgramId = uniquePrograms[i];
                var uniqueProgram = programs[uniqueProgramId];
                if (deepEqual(program, uniqueProgram)) {
                    programIdMapping[programId] = uniqueProgramId;
                    unique = false;
                    break;
                }
            }
            if (unique) {
                uniquePrograms.push(programId);
            }
        }
    }
    remapPrograms(gltf, programIdMapping);
    removeUnusedPrograms(gltf);
}

function remapPrograms(gltf, programIdMapping) {
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var programId = technique.program;
            var mappedProgramId = programIdMapping[programId];
            if (defined(mappedProgramId)) {
                technique.program = mappedProgramId;
            }
        }
    }
}