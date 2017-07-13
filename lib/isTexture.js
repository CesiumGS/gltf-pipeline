'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = isTexture;

function isTexture(name, value) {
    return defined(value.index);
}