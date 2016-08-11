'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedImages;

/**
 * Remove all unused images in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused images.
 */
function removeUnusedImages(gltf, stats) {
    var usedImageIds = findUsedIds(gltf, 'textures', 'source');
// TODO: remove orphan uris
    return removeObject(gltf, 'images', usedImageIds, stats);
}