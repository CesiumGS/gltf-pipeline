'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedBuffers;

/**
 * Remove all unused buffers in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused buffers.
 */
function removeUnusedBuffers(gltf, stats) {
    var usedBufferIds = findUsedIds(gltf, 'bufferViews', 'buffer');
// TODO: remove orphan uris
    return removeObject(gltf, 'buffers', usedBufferIds, stats);
}