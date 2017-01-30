'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = addPipelineExtras;

// Objects with these ids should not have extras added
var exceptions = {
    attributes: true,
    uniforms: true,
    extensions: true
};
/**
 * Adds extras._pipeline to each object that can have extras in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with the added pipeline extras.
 */
function addPipelineExtras(gltf) {
    var objectStack = [];
    gltf.extras = defaultValue(gltf.extras, {});
    gltf.extras._pipeline = defaultValue(gltf.extras._pipeline, {});
    for (var rootObjectId in gltf) {
        if (gltf.hasOwnProperty(rootObjectId)) {
            var rootObject = gltf[rootObjectId];
            for (var topLevelObjectId in rootObject) {
                if (rootObject.hasOwnProperty(topLevelObjectId)) {
                    var topLevelObject = rootObject[topLevelObjectId];
                    if (defined(topLevelObject) && typeof topLevelObject === 'object') {
                        objectStack.push(topLevelObject);
                    }
                }
            }
        }
    }
    if (defined(gltf.asset)) {
        objectStack.push(gltf.asset);
    }
    // Add pipeline extras to compressed textures
    var images = gltf.images;
    for (var imageId in images) {
        if (images.hasOwnProperty(imageId)) {
            var image = images[imageId];
            if (defined(image.extras) && defined(image.extras.compressedImages3DTiles)) {
                var compressedImages = image.extras.compressedImages3DTiles;
                for (var compressedImageId in compressedImages) {
                    if (compressedImages.hasOwnProperty(compressedImageId)) {
                        objectStack.push(compressedImages[compressedImageId]);
                    }
                }
            }
        }
    }
    while (objectStack.length > 0) {
        var object = objectStack.pop();
        if (Array.isArray(object)) {
            var length = object.length;
            for (var i = 0; i < length; i++) {
                var item = object[i];
                if (defined(item) && typeof item === 'object') {
                    objectStack.push(item);
                }
            }
        } else {
            object.extras = defaultValue(object.extras, {});
            object.extras._pipeline = defaultValue(object.extras._pipeline, {});
            for (var propertyId in object) {
                if (object.hasOwnProperty(propertyId)) {
                    var property = object[propertyId];
                    if (defined(property) && typeof property === 'object' && propertyId !== 'extras' && !exceptions[propertyId]) {
                        objectStack.push(property);
                    }
                }
            }
        }
    }

    return gltf;
}