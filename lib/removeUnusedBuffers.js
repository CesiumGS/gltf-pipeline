'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedBuffers;

function removeUnusedBuffers(gltf, stats) {
    var usedBufferIds = findUsedIds(gltf, 'bufferViews', 'buffer');
// TODO: remove orphan uris
    return removeObject(gltf, 'buffers', usedBufferIds, stats);
}