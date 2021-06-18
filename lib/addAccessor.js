'use strict';
const addToArray = require('./addToArray');

module.exports = addAccessor;

/**
 * Get type of an element given its number of components
 *
 * @param {Number} number of components
 * @returns {Number} type of element
 *
 * @private
 */
function getTypeFromSize(size){
  if (size===1) {
    return 'SCALAR';
  } else if (size===2) {
    return 'VEC2';
  } else if (size===3) {
    return 'VEC3';
  } else if (size===4) {
    return 'VEC4';
  }
}

/**
 * Get ID of the component type
 *
 * @param {String} component type as a string
 * @returns {Number} ID of the component type
 *
 * @private
 */
function getIDComponent(componentType){
   if (componentType === 'FLOAT') {
    return 5126;
   } else if (componentType === 'UNSIGNED_INT') {
    return 5125;
   } else if (componentType === 'UNSIGNED_SHORT') {
    return 5123;
   } else if (componentType === 'SHORT') {
    return 5122;
   } else if (componentType === 'UNSIGNED_BYTE') {
    return 5121;
   } else if (componentType === 'BYTE') {
    return 5120;
   }
   return -1;
}

/**
 * Adds accessor to gltf.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Number} buffer view  associated to the accessor.
 * @param {Number} number of elements to be accessed in the bufferView
 * @param {String} component type as a string matching glTF 2.0 specification
 * @param {Number} number of component type per element
 * @param {Object} min & max values of the accessor elements
 * @returns {Number} The bufferView id of the newly added bufferView.
 *
 * @private
 */
function addAccessor(gltf, bufferView, count, componentType, size, minmax){

  const type = getTypeFromSize(size);

  const accessor = {
      bufferView : bufferView,
      byteOffset : 0,
      componentType : getIDComponent(componentType),
      count : count,
      type: type
  };

  if (minmax) {
    accessor.min = minmax.min;
    accessor.max = minmax.max;
  }

  return addToArray(gltf.accessors, accessor);
}
