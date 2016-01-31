'use strict';
var removeObject = require('./removeObject');
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

// TODO: remove orphan uris

    return removeObject(gltf, 'programs', usedProgramIds, stats);
}