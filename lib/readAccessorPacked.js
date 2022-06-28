"use strict";
const Cesium = require("cesium");
const getAccessorByteStride = require("./getAccessorByteStride");
const getComponentReader = require("./getComponentReader");
const numberOfComponentsForType = require("./numberOfComponentsForType");

const ComponentDatatype = Cesium.ComponentDatatype;
const defined = Cesium.defined;

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
  const byteStride = getAccessorByteStride(gltf, accessor);
  const componentTypeByteLength = ComponentDatatype.getSizeInBytes(
    accessor.componentType
  );
  const numberOfComponents = numberOfComponentsForType(accessor.type);
  const count = accessor.count;
  const values = new Array(numberOfComponents * count);

  if (!defined(accessor.bufferView)) {
    return values.fill(0);
  }

  const bufferView = gltf.bufferViews[accessor.bufferView];
  const source = gltf.buffers[bufferView.buffer].extras._pipeline.source;
  let byteOffset =
    accessor.byteOffset + bufferView.byteOffset + source.byteOffset;

  const dataView = new DataView(source.buffer);
  const components = new Array(numberOfComponents);
  const componentReader = getComponentReader(accessor.componentType);

  for (let i = 0; i < count; ++i) {
    componentReader(
      dataView,
      byteOffset,
      numberOfComponents,
      componentTypeByteLength,
      components
    );
    for (let j = 0; j < numberOfComponents; ++j) {
      values[i * numberOfComponents + j] = components[j];
    }
    byteOffset += byteStride;
  }
  return values;
}
