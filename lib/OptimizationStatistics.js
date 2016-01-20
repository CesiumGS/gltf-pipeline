'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberOfImagesRemoved = 0;
    this.numberOfSamplersRemoved = 0;
    this.numberOfShadersRemoved = 0;
    this.numberOfProgramsRemoved = 0;
}

OptimizationStatistics.prototype.print = function(stats) {
    process.stdout.write('Images removed: ' + this.numberOfImagesRemoved + '\n');
    process.stdout.write('Samplers removed: ' + this.numberOfSamplersRemoved + '\n');
    process.stdout.write('Shaders removed: ' + this.numberOfShadersRemoved + '\n');
    process.stdout.write('Programs removed: ' + this.numberOfProgramsRemoved + '\n');
};