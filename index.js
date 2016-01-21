'use strict';

module.exports = {
    addDefaults : require('./lib/addDefaults'),
    removeUnusedImages : require('./lib/removeUnusedImages'),
    removeUnusedSamplers : require('./lib/removeUnusedSamplers'),
    removeUnusedShaders : require('./lib/removeUnusedShaders'),
    removeUnusedBufferViews : require('./lib/removeUnusedBufferViews'),
    removeUnusedSkins : require('./lib/removeUnusedSkins'),
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};