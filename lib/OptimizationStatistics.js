'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberRemoved = {
        images : 0,
        samplers : 0,
        shaders : 0,
        techniques : 0,
        programs : 0,
        buffers : 0,
        bufferViews : 0,
        materials : 0,
        skins : 0,
        cameras : 0,
        textures : 0,
        meshes : 0,
        nodes : 0,
        accessors : 0
    };
}

OptimizationStatistics.prototype.print = function(stats) {
    process.stdout.write('Images removed: ' + this.numberRemoved.images + '\n');
    process.stdout.write('Samplers removed: ' + this.numberRemoved.samplers + '\n');
    process.stdout.write('Shaders removed: ' + this.numberRemoved.shaders + '\n');
    process.stdout.write('Techniques removed: ' + this.numberRemoved.techniques + '\n');
    process.stdout.write('Programs removed: ' + this.numberRemoved.programs + '\n');
    process.stdout.write('Buffers removed: ' + this.numberRemoved.buffers + '\n');
    process.stdout.write('BufferViews removed: ' + this.numberRemoved.bufferViews + '\n');
    process.stdout.write('Materials removed: ' + this.numberRemoved.materials + '\n');
    process.stdout.write('Skins removed: ' + this.numberRemoved.skins + '\n');
    process.stdout.write('Cameras removed: ' + this.numberRemoved.cameras + '\n');
    process.stdout.write('Textures removed: ' + this.numberRemoved.textures + '\n');
    process.stdout.write('Meshes removed: ' + this.numberRemoved.meshes + '\n');
    process.stdout.write('Nodes removed: ' + this.numberRemoved.nodes + '\n');
    process.stdout.write('Accessors removed: ' + this.numberRemoved.accessors + '\n');
};