'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = isTexture;

function isTexture(value) {
    return defined(value.index);
}