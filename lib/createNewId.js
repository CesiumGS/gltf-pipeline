'use strict';
module.exports = createNewId;

/**
 * @private
 */
//Creates a new object id based on the attribute type and existing objects.
function createNewId(gltf, meshId, attributeType, objectType) {
    var idCount = 0;
    var newId = meshId + '_' + attributeType + '_' + objectType + '_' + idCount;
    var objectKeys = Object.keys(gltf[objectType + 's']);
    while (objectKeys.indexOf(newId) != -1) {
        idCount++;
        newId = newId.slice(0, -1) + idCount;
    }

    return newId;
}