'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberRemoved = {
        nodes : 0,
        skins : 0,
        cameras : 0,
        meshes : 0,
        accessors : 0,
        materials : 0,
        bufferViews : 0,
        techniques : 0,
        textures : 0,
        buffers : 0,
        programs : 0,
        images : 0,
        samplers : 0,
        shaders : 0
    };
}
