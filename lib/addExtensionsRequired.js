'use strict';
var Cesium = require('cesium');
var addExtensionsUsed = require('./addExtensionsUsed');
var addToArray = require('./addToArray');

var defined = Cesium.defined;

module.exports = addExtensionsRequired;

/**
 * Adds an extension to gltf.extensionsRequired if it does not already exist.
 * Initializes extensionsRequired if it is not defined.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to add.
 *
 * @private
 */
function addExtensionsRequired(gltf, extension) {
    var extensionsRequired = gltf.extensionsRequired;
    if (!defined(extensionsRequired)) {
        extensionsRequired = [];
        gltf.extensionsRequired = extensionsRequired;
    }
    addToArray(extensionsRequired, extension, true);
    addExtensionsUsed(gltf, extension);
}
