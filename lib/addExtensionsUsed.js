'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = addExtensionsUsed;

function addExtensionsUsed(gltf, extension) {
    var extensionsUsed = gltf.extensionsUsed;
    if (!defined(extensionsUsed)) {
        extensionsUsed = [];
        gltf.extensionsUsed = extensionsUsed;
    }
    if (extensionsUsed.indexOf(extension) < 0) {
        extensionsUsed.push(extension);
    }
}