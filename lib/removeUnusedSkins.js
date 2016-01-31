'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedSkins;

function removeUnusedSkins(gltf, stats) {
    var usedSkinIds = findUsedIds(gltf, 'nodes', 'skin');
    return removeObject(gltf, 'skins', usedSkinIds, stats);
}