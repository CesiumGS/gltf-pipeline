'use strict';
var Cesium = require('cesium');

var AccessorReader = require('./AccessorReader');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getUniqueId = require('./getUniqueId');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var writeBufferComponent = require('./writeBufferComponent');

var defined = Cesium.defined;

module.exports = changeAccessorComponentType;

/**
 * Changes the component type of a specified accessor.
 * If the new component type is smaller than the old one, it will be written in place on the buffer.
 * If it is larger, a new buffer will be created and written.
 *
 * The data is copied as-is, so it must be within the bounds of the target data type.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor A glTF accessor to be changed.
 * @param {Integer} newComponentType The componentType to change to from WebGLConstants.
 * @returns {Object} The glTF with the accessor's componentType changed.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function changeAccessorComponentType(gltf, accessor, newComponentType) {
    var componentType = accessor.componentType;
    if (componentType !== newComponentType) {
        var bufferViews = gltf.bufferViews;
        var buffers = gltf.buffers;
        var bufferViewId = accessor.bufferView;
        var bufferView = bufferViews[bufferViewId];
        var bufferId = bufferView.buffer;
        var buffer = buffers[bufferId];
        var componentByteLength = byteLengthForComponentType(componentType);
        var newComponentByteLength = byteLengthForComponentType(newComponentType);
        var numberOfComponents = numberOfComponentsForType(accessor.type);
        var writeBuffer;
        if (newComponentByteLength > componentByteLength) {
            writeBuffer = Buffer.allocUnsafe(accessor.count * numberOfComponents * newComponentByteLength);
        }
        var accessorReader = new AccessorReader(gltf, accessor);
        var components = [];
        while (!accessorReader.pastEnd()) {
            accessorReader.read(components);
            if (defined(writeBuffer)) {
                for (var i = 0; i < numberOfComponents; i++) {
                    writeBufferComponent(writeBuffer, newComponentType, components[i], accessorReader.index * newComponentByteLength * numberOfComponents + i * newComponentByteLength);
                }
            } else {
                accessorReader.write(components, newComponentType);
            }
            accessorReader.next();
        }
        accessor.componentType = newComponentType;

        if (defined(writeBuffer)) {
            var newBufferViewId = getUniqueId(gltf, 'bufferView');
            var newBufferId = getUniqueId(gltf, 'buffer');
            accessor.bufferView = newBufferViewId;
            accessor.byteOffset = 0;
            accessor.byteStride = 0;
            bufferViews[newBufferViewId] = {
                buffer: newBufferId,
                byteLength: writeBuffer.length,
                byteOffset: 0,
                target: bufferView.target,
                extras: {
                    _pipeline: {}
                }
            };
            buffers[newBufferId] = {
                byteLength: writeBuffer.length,
                type: buffer.type,
                extras: {
                    _pipeline: {
                        source: writeBuffer
                    }
                }
            };
        }
    }
    return gltf;
}
