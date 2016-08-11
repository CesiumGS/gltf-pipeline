'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedSkins;

/**
 * Remove all unused skins in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused skins.
 */
function removeUnusedSkins(gltf, stats) {
    var usedSkinIds = findUsedIds(gltf, 'nodes', 'skin');
    return removeObject(gltf, 'skins', usedSkinIds, stats);
}