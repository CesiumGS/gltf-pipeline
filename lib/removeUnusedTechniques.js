'use strict';
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

module.exports = removeUnusedTechniques;

function removeUnusedTechniques(gltf, stats) {
    var usedTechniqueIds = findUsedIds(gltf, 'materials', 'technique');
    return removeObject(gltf, 'techniques', usedTechniqueIds, stats);
}