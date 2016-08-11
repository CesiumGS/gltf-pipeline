'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedPrograms;

/**
 * Remove all unused programs in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused programs.
 */
function removeUnusedPrograms(gltf, stats) {
    var usedProgramIds = findUsedIds(gltf, 'techniques', 'program');
// TODO: remove orphan uris
    return removeObject(gltf, 'programs', usedProgramIds, stats);
}