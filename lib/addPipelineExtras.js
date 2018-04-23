'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defined = Cesium.defined;

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
    ForEach.shaderLegacy(gltf, function(shader) {
        addExtras(shader);
    });
    ForEach.bufferLegacy(gltf, function(buffer) {
        addExtras(buffer);
    });
    ForEach.imageLegacy(gltf, function (image) {
        addExtras(image);
        ForEach.compressedImage(image, function(compressedImage) {
            addExtras(compressedImage);
        });
    });

    addExtras(gltf);

    return gltf;
}

function addExtras(object) {
    object.extras = defined(object.extras) ? object.extras : {};
    object.extras._pipeline = defined(object.extras._pipeline) ? object.extras._pipeline : {};
}
