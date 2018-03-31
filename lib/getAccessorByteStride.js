'use strict';
var Cesium = require('cesium');
var numberOfComponentsForType = require('./numberOfComponentsForType');

var ComponentDatatype = Cesium.ComponentDatatype;
var defined = Cesium.defined;

module.exports = getAccessorByteStride;

/**
 * Returns the byte stride of the provided accessor.
 * If the byteStride is 0, it is calculated based on type and componentType
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor The accessor.
 * @returns {Number} The byte stride of the accessor.
 *
 * @private
 */
function getAccessorByteStride(gltf, accessor) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    if (defined(bufferView) && defined(bufferView.byteStride) && bufferView.byteStride > 0) {
        return bufferView.byteStride;
    }
    return ComponentDatatype.getSizeInBytes(accessor.componentType) * numberOfComponentsForType(accessor.type);
}
