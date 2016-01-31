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
