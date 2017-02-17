'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = findUsedIds;

/**
 * @private
 */
function findUsedIds(gltf, name, propertyName) {
    var usedIds = {};
    var array = gltf[name];

    if (defined(array)) {
        var arrayLength = array.length;
        for (var id = 0; id < arrayLength; id++) {
            var object = array[id];
            var idProperty = object[propertyName];
            if (defined(idProperty)) {
                usedIds[idProperty] = true;
            }
        }
    }

    return usedIds;
}