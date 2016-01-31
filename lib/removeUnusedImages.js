'use strict';
var removeObject = require('./removeObject');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedImages;

function removeUnusedImages(gltf, stats) {
    var usedImageIds = {};
    var textures = gltf.textures;

    // Build hash of used images by iterating through textures
    if (defined(textures)) {
        for (var textureId in textures) {
            if (textures.hasOwnProperty(textureId)) {
                var id = textures[textureId].source;
                usedImageIds[id] = true;
            }
        }
    }

// TODO: remove orphan uris

    return removeObject(gltf, 'images', usedImageIds, stats);
}