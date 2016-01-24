'use strict';

module.exports = {
    addDefaults : require('./lib/addDefaults'),
    removeUnusedImages : require('./lib/removeUnusedImages'),
    removeUnusedSamplers : require('./lib/removeUnusedSamplers'),
    removeUnusedShaders : require('./lib/removeUnusedShaders'),
    removeUnusedTechniques : require('./lib/removeUnusedTechniques'),
    removeUnusedPrograms : require('./lib/removeUnusedPrograms'),
    removeUnusedBufferViews : require('./lib/removeUnusedBufferViews'),
    removeUnusedSkins : require('./lib/removeUnusedSkins'),
    removeUnusedCameras : require('./lib/removeUnusedCameras'),
    removeUnusedMeshes : require('./lib/removeUnusedMeshes'),
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};