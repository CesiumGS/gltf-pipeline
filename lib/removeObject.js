'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeObject;

/**
 * @private
 */
function removeObject(gltf, name, usedId) {
    // Iterate through objects and remove those that are not in the hash
    var objects = gltf[name];
    if (defined(objects)) {
        var used = {};
        for (var id in objects) {
            if (objects.hasOwnProperty(id)) {
                // If this object is in the hash, then keep it in the glTF asset
                if (defined(usedId[id])) {
                    used[id] = objects[id];
                }
            }
        }
        gltf[name] = used;
    }
    return gltf;
}
