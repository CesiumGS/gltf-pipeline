'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedPrograms;

function removeUnusedPrograms(gltf, stats) {
    var usedProgramIds = findUsedIds(gltf, 'techniques', 'program');
// TODO: remove orphan uris
    return removeObject(gltf, 'programs', usedProgramIds, stats);
}