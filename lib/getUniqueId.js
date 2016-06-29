'use strict';

module.exports = getUniqueId;

// Given a prefix for a new ID, checks the json for matching prefixes throughout and generates a unique ID.
function getUniqueId(gltf, prefix) {
    var prefixMatches = [];

    // Check each top level object in the gltf for instances of the prefix
    var topLevelObjectIds = Object.keys(gltf);
    var topLevelIdCount = topLevelObjectIds.length;
    for (var i = 0; i < topLevelIdCount; i++) {
        var topLevelObject = gltf[topLevelObjectIds[i]];
        if (topLevelObject.constructor === Object) {
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

    // Generate a new ID based on the prefix and any occurences of the prefix throughout the json
    // Case where the prefix is already unique
    if (prefixMatches.indexOf(prefix) === -1) {
        return prefix;
    }

    // Impossible for prefixMatches to contain all strings of form 'prefix_X' and 'prefix'
    var prefixMatchCount = prefixMatches.length;
    for (i = 0; i < prefixMatchCount; i++) {
        var newID = prefix + '_' + i;
        if (prefixMatches.indexOf(newID) === -1) {
            return newID;
        }
    }
}
