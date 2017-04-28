'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = isTexture;

var textureNames = {
    ambient: true,
    diffuse: true,
    emission: true,
    specular: true
};

function isTexture(name, value) {
    return value.length === 1 && defined(textureNames[name]);
}