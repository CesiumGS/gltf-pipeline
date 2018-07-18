'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = findUsedIds;

/**
 * @private
 */
function findUsedIds(gltf, name, idName) {
    var usedIds = {};
    var objects = gltf[name];

    // Build hash of used ids by iterating through objects
    if (defined(objects)) {
        for (var objectId in objects) {
            if (objects.hasOwnProperty(objectId)) {
                var id = (objects[objectId])[idName];
                if (defined(id)) {
                    usedIds[id] = true;
                }
            }
        }
    }

    return usedIds;
}
