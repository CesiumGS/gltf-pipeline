'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponentType = require('./readBufferComponentType');

module.exports = findAccessorMinMax;

function findAccessorMinMax(gltf, accessor) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var bufferViewId = accessor.bufferView;
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var min = new Array(numberOfComponents).fill(Number.POSITIVE_INFINITY);
    var max = new Array(numberOfComponents).fill(Number.NEGATIVE_INFINITY);
    if (defined(bufferViewId) && defined(bufferViews) && bufferViews.hasOwnProperty(bufferViewId)) {
        var bufferView = bufferViews[bufferViewId];
        var bufferId = bufferView.buffer;
        if (defined(bufferId) && defined(buffers) && buffers.hasOwnProperty(bufferId)) {
            var buffer = buffers[bufferId];
            var source = buffer.extras._pipeline.source;
            var count = accessor.count;
            var byteStride = getAccessorByteStride(accessor);
            var byteOffset = accessor.byteOffset + bufferView.byteOffset;
            var componentType = accessor.componentType;
            var componentByteLength = byteLengthForComponentType(componentType);

            for (var i = 0; i < count; i++) {
                for (var j = 0; j < numberOfComponents; j++) {
                    var value = readBufferComponentType(source, componentType, byteOffset + j * componentByteLength);
                    min[j] = Math.min(min[j], value);
                    max[j] = Math.max(max[j], value);
                }
                byteOffset += byteStride;
            }
        }
    }
    return {
        min : min,
        max : max
    };
}