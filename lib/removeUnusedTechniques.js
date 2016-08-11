'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedTechniques;

/**
 * Remove all unused techniques in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused techniques
 */
function removeUnusedTechniques(gltf, stats) {
    var usedTechniqueIds = findUsedIds(gltf, 'materials', 'technique');
    return removeObject(gltf, 'techniques', usedTechniqueIds, stats);
}