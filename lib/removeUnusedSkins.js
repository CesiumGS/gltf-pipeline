'use strict';
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

    // Iterate through skins and remove those that are not in the hash
    var numberOfSkinsRemoved = 0;
    var skins = gltf.skins;
    if (defined(skins)) {
        var usedSkins = {};

        for (var skinId in skins) {
            if (skins.hasOwnProperty(skinId)) {
                // If this skin is in the hash, then keep it in the glTF asset
                if (defined(usedSkinIds[skinId])) {
                    usedSkins[skinId] = skins[skinId];
                } else {
                    ++numberOfSkinsRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfSkinsRemoved += numberOfSkinsRemoved;
        }

        gltf.skins = usedSkins;
    }


    return gltf;
}