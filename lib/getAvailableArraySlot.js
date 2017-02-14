'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = getAvailableArraySlot;

function getAvailableArraySlot(array) {
  var arrayLength = array.length;
  for (var i = 0; i < arrayLength; i++) {
    if (!defined(array[i])) {
      return i;
    }
  }
  return arrayLength;
}