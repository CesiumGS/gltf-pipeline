'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberOfImagesRemoved = 0;
    this.numberOfSamplersRemoved = 0;
}

OptimizationStatistics.prototype.print = function(stats) {
    process.stdout.write('Images removed: ' + this.numberOfImagesRemoved + '\n');
    process.stdout.write('Samplers removed: ' + this.numberOfSamplersRemoved + '\n');
};