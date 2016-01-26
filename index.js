'use strict';

module.exports = {
    addDefaults : require('./lib/addDefaults'),
    removeUnusedImages : require('./lib/removeUnusedImages'),
    removeUnusedSamplers : require('./lib/removeUnusedSamplers'),
    removeUnusedShaders : require('./lib/removeUnusedShaders'),
    removeUnusedTechniques : require('./lib/removeUnusedTechniques'),
    removeUnusedPrograms : require('./lib/removeUnusedPrograms'),
    removeUnusedBuffers : require('./lib/removeUnusedBuffers'),
    removeUnusedBufferViews : require('./lib/removeUnusedBufferViews'),
    removeUnusedMaterials : require('./lib/removeUnusedMaterials'),
    removeUnusedSkins : require('./lib/removeUnusedSkins'),
    removeUnusedCameras : require('./lib/removeUnusedCameras'),
    removeUnusedTextures : require('./lib/removeUnusedTextures'),
    removeUnusedMeshes : require('./lib/removeUnusedMeshes'),
    removeUnusedAnimationSamplers : require('./lib/removeUnusedAnimationSamplers'),
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};