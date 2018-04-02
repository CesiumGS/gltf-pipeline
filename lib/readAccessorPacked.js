'use strict';
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var getComponentReader = require('./getComponentReader.js');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = readAccessorPacked;

/**
 * Returns the accessor data in a contiguous array.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor The accessor.
 * @returns {Array} The accessor values in a contiguous array.
 *
 * @private
 */
function readAccessorPacked(gltf, accessor) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var source = gltf.buffers[bufferView.buffer].extras._pipeline.source;
    var byteOffset = accessor.byteOffset + bufferView.byteOffset + source.byteOffset;
    var byteStride = getAccessorByteStride(gltf, accessor);
    var componentTypeByteLength = byteLengthForComponentType(accessor.componentType);
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var count = accessor.count;

    var dataView = new DataView(source.buffer);
    var components = new Array(numberOfComponents);
    var componentReader = getComponentReader(accessor.componentType);

    var values = [];
    for (var i = 0; i < count; ++i) {
        componentReader(dataView, byteOffset, numberOfComponents, componentTypeByteLength, components);

        for (var j = 0; j < numberOfComponents; ++j) {
            values.push(components[j]);
        }

        byteOffset += byteStride;
    }
    return values;
}
