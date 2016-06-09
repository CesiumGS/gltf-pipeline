'use strict';

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponentType = require('./readBufferComponentType');

module.exports = findAccessorMinMax;

function findAccessorMinMax(gltf, accessor) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var bufferView = bufferViews[accessor.bufferView];
    var buffer = buffers[bufferView.buffer];
    var source = buffer.extras._pipeline.source;
    var count = accessor.count;
    var byteStride = getAccessorByteStride(accessor);
    var byteOffset = accessor.byteOffset + bufferView.byteOffset;
    var componentType = accessor.componentType;
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var componentByteLength = byteLengthForComponentType(componentType);
    var min = new Array(numberOfComponents).fill(Number.POSITIVE_INFINITY);
    var max = new Array(numberOfComponents).fill(Number.NEGATIVE_INFINITY);
    for (var i = 0; i < count; i++) {
        for (var j = 0; j < numberOfComponents; j++) {
            var value = readBufferComponentType(source, componentType, byteOffset + j * componentByteLength);
            min[j] = Math.min(min[j], value);
            max[j] = Math.max(max[j], value);
        }
        byteOffset += byteStride;
    }
    return {
        min : min,
        max : max
    }
}