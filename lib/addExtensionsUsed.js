'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = addExtensionsUsed;

/**
 * Adds an extension to gltf.extensionsUsed if it does not already exist.
 * Initializes extensionsUsed if it is not defined.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to add.
 */
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
