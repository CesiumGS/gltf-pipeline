'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedImages;

function removeUnusedImages(gltf, stats) {
    var usedImageIds = findUsedIds(gltf, 'textures', 'source');
// TODO: remove orphan uris
    return removeObject(gltf, 'images', usedImageIds, stats);
}