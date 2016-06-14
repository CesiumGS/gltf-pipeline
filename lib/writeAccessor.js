'use strict';
var byteLengthForComponentType = require('./byteLengthForComponentType');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var writeBufferComponentType = require('./writeBufferComponentType');

module.exports = writeAccessor;

function writeAccessor(gltf, accessor, dataArray) {
    var accessorType = accessor.type;
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var buffer = gltf.buffers[bufferView.buffer].extras._pipeline.source;

    var attributeCount = accessor.count;
    var componentCount = numberOfComponentsForType(accessorType);
    var componentType = accessor.componentType;
    var componentBytes = byteLengthForComponentType(componentType);
    var currentBufferIndex = accessor.byteOffset + bufferView.byteOffset;

    for (var i = 0; i < attributeCount * componentCount; i++) {
        writeBufferComponentType(buffer, componentType, dataArray[i], currentBufferIndex);
        currentBufferIndex += componentBytes;
    }
}
