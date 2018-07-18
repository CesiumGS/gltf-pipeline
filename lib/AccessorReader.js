'use strict';
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');
var writeBufferComponent = require('./writeBufferComponent');

module.exports = AccessorReader;

/**
 * Reads an accessor incrementally. This is useful to keep overhead low when
 * memory consumption is important.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor The accessor object from glTF to read.
 * @constructor
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function AccessorReader(gltf, accessor) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var bufferViewId = accessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];

    this.accessor = accessor;
    this.byteOffset = accessor.byteOffset + bufferView.byteOffset;
    this.byteStride = getAccessorByteStride(accessor);
    this.componentType = accessor.componentType;
    this.numberOfComponents = numberOfComponentsForType(accessor.type);
    this.count = accessor.count;
    this.index = 0;
    this.bufferView = bufferView;
    this.buffer = buffer;
    this.source = buffer.extras._pipeline.source;
}

/**
 * Read data at the current index into components.
 * Data will be read into components starting at index 0.
 * Components will be grown if the number of components for the accessor is greater than the array size.
 *
 * @param {Array} components The array to read the data into.
 * @returns {Array} components with data written into it.
 */
AccessorReader.prototype.read = function(components) {
    if (this.index >= this.count) {
        return undefined;
    }
    var componentByteLength = byteLengthForComponentType(this.componentType);
    for (var i = 0; i < this.numberOfComponents; i++) {
        var data = readBufferComponent(this.source,
            this.componentType,
            this.byteOffset + (this.byteStride * this.index) + (componentByteLength * i)
        );
        if (i >= components.length) {
            components.push(data);
        } else {
            components[i] = data;
        }
    }
    return components;
};

/**
 * Write data at the current index into the accessor data.
 * Specifying a componentType different from the accessor's componentType can be done for a use case like attribute compression.
 * The data is being read, compressed, and then written back as a different, smaller data type. This is done in place
 * and then the gaps can be removed using uninterleaveAndPackBuffers.
 *
 * @param {Array} data The data to write into the accessor.
 * @param {Number} [componentType=this.componentType] The component type to use for writing the data.
 * @param {Number} [dataOffset=0] Read starting from a different position in the data array.
 */
AccessorReader.prototype.write = function(data, componentType, dataOffset) {
    componentType = defaultValue(componentType, this.componentType);
    dataOffset = defaultValue(dataOffset, 0);
    var componentByteLength = byteLengthForComponentType(componentType);
    var byteStride = this.byteStride;
    if (this.accessor.byteStride === 0 && componentType !== this.componentType) {
        byteStride = byteLengthForComponentType(componentType) * this.numberOfComponents;
    }
    for (var i = 0; i < this.numberOfComponents; i++) {
        writeBufferComponent(this.source,
            componentType,
            data[i + dataOffset],
            this.byteOffset + (byteStride * this.index) + (componentByteLength * i)
        );
    }
};

/**
 * Get if the AccessorReader is past the end of the accessor data.
 *
 * @returns {Boolean} True if the current index does not correspond to valid data, False if there is data to read.
 */
AccessorReader.prototype.pastEnd = function() {
    return this.index >= this.count;
};

/**
 * Increment AccessorReader.index by one.
 */
AccessorReader.prototype.next = function() {
    this.index++;
};

/**
 * Set AccessorReader.index to zero.
 */
AccessorReader.prototype.reset = function() {
    this.index = 0;
};
