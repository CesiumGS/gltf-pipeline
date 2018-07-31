'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var removeExtensionsUsed = require('./removeExtensionsUsed');

var defined = Cesium.defined;
var isArray = Cesium.isArray;

module.exports = removeExtension;

/**
 * Removes an extension from gltf.extensions, gltf.extensionsUsed, gltf.extensionsRequired, and any other objects in the glTF if it is present.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} extension The extension to remove.
 *
 * @returns {*} The extension data removed from gltf.extensions.
 */
function removeExtension(gltf, extension) {
    removeExtensionsUsed(gltf, extension); // Also removes from extensionsRequired

    if (extension === 'CESIUM_RTC') {
        removeCesiumRTC(gltf);
    }

    return removeExtensionAndTraverse(gltf, extension);
}

function removeCesiumRTC(gltf) {
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueUniform(technique, function(uniform) {
            if (uniform.semantic === 'CESIUM_RTC_MODELVIEW') {
                uniform.semantic = 'MODELVIEW';
            }
        });
    });
}

function removeExtensionAndTraverse(object, extension) {
    if (isArray(object)) {
        var length = object.length;
        for (var i = 0; i < length; ++i) {
            removeExtensionAndTraverse(object[i], extension);
        }
    } else if (object !== null && typeof object === 'object' && object.constructor === Object) {
        var extensions = object.extensions;
        var extensionData;
        if (defined(extensions)) {
            extensionData = extensions[extension];
            if (defined(extensionData)) {
                delete extensions[extension];
                if (Object.keys(extensions).length === 0) {
                    delete object.extensions;
                }
            }
        }
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                removeExtensionAndTraverse(object[key], extension);
            }
        }
        return extensionData;
    }
}
