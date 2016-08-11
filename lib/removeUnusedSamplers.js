'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedSamplers;

/**
 * Remove all unused samplers in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused samplers.
 */
function removeUnusedSamplers(gltf, stats) {
    var usedSamplerIds = findUsedIds(gltf, 'textures', 'sampler');
    return removeObject(gltf, 'samplers', usedSamplerIds, stats);
}