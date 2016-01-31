'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedSkins;

function removeUnusedSkins(gltf, stats) {
    var usedSkinIds = {};
    var nodes = gltf.nodes;

    // Build hash of used skins by iterating through nodes
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                if (defined(nodes[nodeId].skin)) {
                    var id = nodes[nodeId].skin;
                    usedSkinIds[id] = true;
                }
            }
        }
    }

    return removeObject(gltf, 'skins', usedSkinIds, stats);
}