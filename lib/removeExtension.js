'use strict';
var Cesium = require('cesium');
var removeExtensionsUsed = require('./removeExtensionsUsed');

var defined = Cesium.defined;

module.exports = removeExtension;

/**
 * Removes an extension from gltf.extensions, gltf.extensionsUsed, and gltf.extensionsRequired if it is present.
 * <p>
 * Does not remove the extension from other objects in the glTF.
 * </p>
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to remove.
 *
 * @returns {*} The extension data removed from gltf.extensions.
 */
function removeExtension(gltf, extension) {
    removeExtensionsUsed(gltf, extension); // Also removes from extensionsRequired

    var extensions = gltf.extensions;
    if (defined(extensions)) {
        var extensionData = extensions[extension];
        delete extensions[extension];
        if (Object.keys(extensions).length === 0) {
            delete gltf.extensions;
        }
        return extensionData;
    }
}
