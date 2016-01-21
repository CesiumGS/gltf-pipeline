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
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};