'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedBufferViews;

function removeUnusedBufferViews(gltf, stats) {
    var usedBufferViewIds = findUsedIds(gltf, 'accessors', 'bufferView');
// TODO: remove orphan uris
    return removeObject(gltf, 'bufferViews', usedBufferViewIds, stats);
}