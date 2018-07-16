'use strict';
var Cesium = require('cesium');
var addToArray = require('./addToArray');

var defined = Cesium.defined;

module.exports = addExtensionsUsed;

/**
 * Adds an extension to gltf.extensionsUsed if it does not already exist.
 * Initializes extensionsUsed if it is not defined.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to add.
 *
 * @private
 */
function addExtensionsUsed(gltf, extension) {
    var extensionsUsed = gltf.extensionsUsed;
    if (!defined(extensionsUsed)) {
        extensionsUsed = [];
        gltf.extensionsUsed = extensionsUsed;
    }
    addToArray(extensionsUsed, extension, true);
}
