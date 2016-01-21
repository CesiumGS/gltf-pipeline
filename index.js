'use strict';

module.exports = {
    addDefaults : require('./lib/addDefaults'),
    removeUnusedImages : require('./lib/removeUnusedImages'),
    removeUnusedSamplers : require('./lib/removeUnusedSamplers'),
    removeUnusedShaders : require('./lib/removeUnusedShaders'),
    removeUnusedPrograms : require('./lib/removeUnusedPrograms'),
    removeUnusedBufferViews : require('./lib/removeUnusedBufferViews'),
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};