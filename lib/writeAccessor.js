'use strict';
var AccessorReader = require('./AccessorReader');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = writeAccessor;

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
