'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = getUniqueId;

// Given a prefix for a new ID, checks the gltf for matching prefixes in top-level objects with IDs and returns a unique ID.
function getUniqueId(gltf, prefix) {
    var prefixMatches = [];

    // Check top level objects with ids for instances of the prefix
    checkForPrefix(gltf.nodes, prefixMatches, prefix);
    checkForPrefix(gltf.skins, prefixMatches, prefix);
    checkForPrefix(gltf.cameras, prefixMatches, prefix);
    checkForPrefix(gltf.meshes, prefixMatches, prefix);
    checkForPrefix(gltf.accessors, prefixMatches, prefix);
    checkForPrefix(gltf.materials, prefixMatches, prefix);
    checkForPrefix(gltf.bufferViews, prefixMatches, prefix);
    checkForPrefix(gltf.techniques, prefixMatches, prefix);
    checkForPrefix(gltf.textures, prefixMatches, prefix);
    checkForPrefix(gltf.buffers, prefixMatches, prefix);
    checkForPrefix(gltf.programs, prefixMatches, prefix);
    checkForPrefix(gltf.images, prefixMatches, prefix);
    checkForPrefix(gltf.samplers, prefixMatches, prefix);
    checkForPrefix(gltf.shaders, prefixMatches, prefix);

    // Generate a new ID based on the prefix and any occurrences of the prefix throughout the json
    // Case where the prefix is already unique
    if (prefixMatches.indexOf(prefix) === -1) {
        return prefix;
    }

    // Impossible for prefixMatches to contain all strings of form 'prefix_X', 0 <= X < count, and 'prefix'
    var prefixMatchCount = prefixMatches.length;
    for (var i = 0; i < prefixMatchCount; i++) {
        var newID = prefix + '_' + i;
        if (prefixMatches.indexOf(newID) === -1) {
            return newID;
        }
    }
}

function checkForPrefix(topLevelObject, prefixMatches, prefix) {
    if (defined(topLevelObject)) {
        var objectIds = Object.keys(topLevelObject);
        var objectIdCount = objectIds.length;
        for (var j = 0; j < objectIdCount; j++) {
            var idString = objectIds[j];
            if (idString.startsWith(prefix)) {
                prefixMatches.push(idString);
            }
        }
    }
}
