'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = getUniqueId;

// Given a prefix for a new ID, checks the json for matching prefixes throughout and generates a unique ID.
function getUniqueId(json, prefix) {
    var prefixMatches = [];
    // Perform stack based depth-first traversal of the json
    var rootIDs = Object.keys(json);
    if (!defined(rootIDs)) {
        return prefix;
    }
    var rootIdCount = rootIDs.length;
    var idString = '';

    var stack = [];
    var currentObject;
    for (var i = 0; i < rootIdCount; i++) {
        // Check ID against the prefix
        idString = rootIDs[i];
        if (idString.startsWith(prefix)) {
            prefixMatches.push(idString);
        }
        currentObject = json[idString];
        if (currentObject.constructor === Object) {
            stack.push(json[idString]);
        }
    }

    while (stack.length > 0) {
        currentObject = stack.pop();
        var ids = Object.keys(currentObject);
        var idCount = ids.length;
        for (i = 0; i < idCount; i++) {
            // Check ID against the prefix
            idString = ids[i];
            if (idString.startsWith(prefix)) {
                prefixMatches.push(idString);
            }

            if (currentObject.constructor === Object) {
                stack.push(currentObject[idString]);
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
