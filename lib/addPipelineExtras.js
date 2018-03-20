'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defaultValue = Cesium.defaultValue;

module.exports = addPipelineExtras;

/**
 * Adds extras._pipeline to each object that can have extras in the glTF asset.
 * This stage runs before updateVersion and handles both glTF 1.0 and glTF 2.0 assets.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with the added pipeline extras.
 *
 * @private
 */
function addPipelineExtras(gltf) {
    ForEach.objectLegacy(gltf.shaders, function(shader) {
        addExtras(shader);
    });
    ForEach.objectLegacy(gltf.buffers, function(buffer) {
        addExtras(buffer);
    });
    ForEach.objectLegacy(gltf.images, function (image) {
        addExtras(image);
        ForEach.compressedImage(image, function(compressedImage) {
            addExtras(compressedImage);
        });
    });

    addExtras(gltf);

    return gltf;
}

function addExtras(object) {
    object.extras = defaultValue(object.extras, {});
    object.extras._pipeline = defaultValue(object.extras._pipeline, {});
}
