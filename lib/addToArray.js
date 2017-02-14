'use strict';
var getAvailableArraySlot = require('./getAvailableArraySlot');

module.exports = addToArray;

function addToArray(array, element) {
  var index = getAvailableArraySlot(array);
  if (index >= array.length) {
    array.push(element);
    return array.length - 1;
  }
  array[index] = element;
  return index;
}