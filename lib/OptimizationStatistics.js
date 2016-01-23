'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberOfImagesRemoved = 0;
    this.numberOfSamplersRemoved = 0;
    this.numberOfShadersRemoved = 0;
    this.numberOfTechniquesRemoved = 0;
    this.numberOfProgramsRemoved = 0;
    this.numberOfBufferViewsRemoved = 0;
    this.numberOfMaterialsRemoved = 0;
    this.numberOfSkinsRemoved = 0;
    this.numberOfCamerasRemoved = 0;
}

OptimizationStatistics.prototype.print = function(stats) {
    process.stdout.write('Images removed: ' + this.numberOfImagesRemoved + '\n');
    process.stdout.write('Samplers removed: ' + this.numberOfSamplersRemoved + '\n');
    process.stdout.write('Shaders removed: ' + this.numberOfShadersRemoved + '\n');
    process.stdout.write('Techniques removed: ' + this.numberOfTechniquesRemoved + '\n');
    process.stdout.write('Programs removed: ' + this.numberOfProgramsRemoved + '\n');
    process.stdout.write('BufferViews removed: ' + this.numberOfBufferViewsRemoved + '\n');
    process.stdout.write('Materials removed: ' + this.numberOfMaterialsRemoved + '\n');
    process.stdout.write('Skins removed: ' + this.numberOfSkinsRemoved + '\n');
    process.stdout.write('Cameras removed: ' + this.numberOfCamerasRemoved + '\n');
};