'use strict';
module.exports = addToArray;

function addToArray(array, element) {
    array.push(element);
    return array.length - 1;
}