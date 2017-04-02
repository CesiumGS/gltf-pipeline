'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = removeExtensionsRequired;

/**
 * Removes an extension from gltf.extensionsRequired if it is present.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to remove.
 */
function removeExtensionsRequired(gltf, extension) {
    var extensionsRequired = gltf.extensionsRequired;
    if (defined(extensionsRequired)) {
        var index = extensionsRequired.indexOf(extension);
        if (index >= 0) {
            extensionsRequired.splice(index, 1);
        }
        if (extensionsRequired.length === 0) {
            delete gltf.extensionsRequired;
        }
    }
}
