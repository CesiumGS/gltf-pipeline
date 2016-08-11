'use strict';
var AccessorReader = require('./AccessorReader');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = writeAccessor;

/**
 * Writes the contents of dataArray into an accessor.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {Object} accessor glTF accessor where data should be written.
 * @param {Array} dataArray Data to write into the accessor.
 */
function writeAccessor(gltf, accessor, dataArray) {
    var accessorReader = new AccessorReader(gltf, accessor);
    var componentType = accessor.componentType;
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    do {
        accessorReader.write(dataArray, componentType, numberOfComponents * accessorReader.index);
        accessorReader.next();
    }
    while (accessorReader.hasNext());
}
