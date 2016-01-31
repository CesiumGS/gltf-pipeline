'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var removeUnusedNodes = require('./removeUnusedNodes');
var removeUnusedSkins = require('./removeUnusedSkins');
var removeUnusedCameras = require('./removeUnusedCameras');
var removeUnusedMeshes = require('./removeUnusedMeshes');
var removeUnusedAccessors = require('./removeUnusedAccessors');
var removeUnusedMaterials = require('./removeUnusedMaterials');
var removeUnusedBufferViews = require('./removeUnusedBufferViews');
var removeUnusedTechniques = require('./removeUnusedTechniques');
var removeUnusedTextures = require('./removeUnusedTextures');
var removeUnusedBuffers = require('./removeUnusedBuffers');
var removeUnusedPrograms = require('./removeUnusedPrograms');
var removeUnusedImages = require('./removeUnusedImages');
var removeUnusedSamplers = require('./removeUnusedSamplers');
var removeUnusedShaders = require('./removeUnusedShaders');

module.exports = removeUnused;

function removeUnused(gltf, stats) {
    //Remove in top-down order so newly unused objects down the hierarchy will be removed as well
    removeUnusedNodes(gltf, stats);
    removeUnusedSkins(gltf, stats);
    removeUnusedCameras(gltf, stats);
    removeUnusedMeshes(gltf, stats);
    removeUnusedAccessors(gltf, stats);
    removeUnusedMaterials(gltf, stats);
    removeUnusedBufferViews(gltf, stats);
    removeUnusedTechniques(gltf, stats);
    removeUnusedTextures(gltf, stats);
    removeUnusedBuffers(gltf, stats);
    removeUnusedPrograms(gltf, stats);
    removeUnusedImages(gltf, stats);
    removeUnusedSamplers(gltf, stats);
    removeUnusedShaders(gltf, stats);

    return gltf;
}