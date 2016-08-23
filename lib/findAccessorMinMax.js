'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');

module.exports = findAccessorMinMax;

/**
 * Finds the min and max for an accessor in gltf.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor The accessor object from the glTF asset to read.
 * @returns {{min: Array, max: Array}} min holding the array of minimum values and max holding the array of maximum values.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
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
                    var value = readBufferComponent(source, componentType, byteOffset + j * componentByteLength);
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