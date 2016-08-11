'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedBufferViews;

/**
 * Remove all unused buffer views in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused buffers views.
 */
function removeUnusedBufferViews(gltf, stats) {
    var usedBufferViewIds = findUsedIds(gltf, 'accessors', 'bufferView');
// TODO: remove orphan uris
    return removeObject(gltf, 'bufferViews', usedBufferViewIds, stats);
}