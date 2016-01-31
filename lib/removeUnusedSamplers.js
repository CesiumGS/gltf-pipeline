'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedSamplers;

function removeUnusedSamplers(gltf, stats) {
    var usedSamplerIds = findUsedIds(gltf, 'textures', 'sampler');
    return removeObject(gltf, 'samplers', usedSamplerIds, stats);
}