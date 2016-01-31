'use strict';

var fs = require('fs');
var removeUnused = require('../../').removeUnused;
var OptimizationStatistics = require('../../').OptimizationStatistics;
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestUnused.gltf';

describe('removeUnused', function() {
    it('removes a tree of objects', function(done) {
        fs.readFile(gltfPath, function (err, data) {
            if (err) {
                throw err;
            }

            var gltf = JSON.parse(data);
            var stats = new OptimizationStatistics();
            removeUnused(gltf, stats);

            expect(gltf.accessors.accessor_23).not.toBeDefined();
            expect(gltf.accessors.animAccessor_0).not.toBeDefined();
            expect(gltf.accessors["IBM_Armature_Cylinder-skin"]).not.toBeDefined();
            expect(gltf.bufferViews.bufferView_30).not.toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest).not.toBeDefined();
            expect(gltf.cameras.camera_0).not.toBeDefined();
            expect(gltf.images.Image0001).not.toBeDefined();
            expect(gltf.materials["Effect-Texture"]).not.toBeDefined();
            expect(gltf.meshes["Geometry-mesh002"]).not.toBeDefined();
            expect(gltf.nodes["Geometry-mesh002Node"]).not.toBeDefined();
            expect(gltf.nodes.groupLocator030Node).not.toBeDefined();
            expect(gltf.nodes.node_3).not.toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).not.toBeDefined();
            expect(gltf.programs.program_0).not.toBeDefined();
            expect(gltf.samplers.sampler_0).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0VS).not.toBeDefined();
            expect(gltf.skins["Armature_Cylinder-skin"]).not.toBeDefined();
            expect(gltf.techniques.technique0).not.toBeDefined();
            expect(gltf.textures.texture_Image0001).not.toBeDefined();

            expect(stats.numberOfNodesRemoved).toEqual(4);
            expect(stats.numberOfSkinsRemoved).toEqual(1);
            expect(stats.numberOfCamerasRemoved).toEqual(1);
            expect(stats.numberOfMeshesRemoved).toEqual(1);
            expect(stats.numberOfAccessorsRemoved).toEqual(3);
            expect(stats.numberOfMaterialsRemoved).toEqual(1);
            expect(stats.numberOfBufferViewsRemoved).toEqual(1);
            expect(stats.numberOfTechniquesRemoved).toEqual(1);
            expect(stats.numberOfTexturesRemoved).toEqual(1);
            expect(stats.numberOfBuffersRemoved).toEqual(1);
            expect(stats.numberOfProgramsRemoved).toEqual(1);
            expect(stats.numberOfImagesRemoved).toEqual(1);
            expect(stats.numberOfSamplersRemoved).toEqual(1);
            expect(stats.numberOfShadersRemoved).toEqual(2);
            done();
        });
    });

    it('does not remove any objects', function(done) {
        fs.readFile(gltfPath, function (err, data) {
            if (err) {
                throw err;
            }

            var gltf = JSON.parse(data);
            gltf.scenes.defaultScene.nodes[0] = 'node_3';
            gltf.animations.animation_0.parameters["TIME"] = 'animAccessor_0';
            var stats = new OptimizationStatistics();
            removeUnused(gltf, stats);

            expect(gltf.accessors.accessor_23).toBeDefined();
            expect(gltf.accessors.animAccessor_0).toBeDefined();
            expect(gltf.accessors["IBM_Armature_Cylinder-skin"]).toBeDefined();
            expect(gltf.bufferViews.bufferView_30).toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest).toBeDefined();
            expect(gltf.cameras.camera_0).toBeDefined();
            expect(gltf.images.Image0001).toBeDefined();
            expect(gltf.materials["Effect-Texture"]).toBeDefined();
            expect(gltf.meshes["Geometry-mesh002"]).toBeDefined();
            expect(gltf.nodes["Geometry-mesh002Node"]).toBeDefined();
            expect(gltf.nodes.groupLocator030Node).toBeDefined();
            expect(gltf.nodes.node_3).toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).toBeDefined();
            expect(gltf.programs.program_0).toBeDefined();
            expect(gltf.samplers.sampler_0).toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();
            expect(gltf.skins["Armature_Cylinder-skin"]).toBeDefined();
            expect(gltf.techniques.technique0).toBeDefined();
            expect(gltf.textures.texture_Image0001).toBeDefined();

            expect(stats.numberOfNodesRemoved).toEqual(0);
            expect(stats.numberOfSkinsRemoved).toEqual(0);
            expect(stats.numberOfCamerasRemoved).toEqual(0);
            expect(stats.numberOfMeshesRemoved).toEqual(0);
            expect(stats.numberOfAccessorsRemoved).toEqual(0);
            expect(stats.numberOfMaterialsRemoved).toEqual(0);
            expect(stats.numberOfBufferViewsRemoved).toEqual(0);
            expect(stats.numberOfTechniquesRemoved).toEqual(0);
            expect(stats.numberOfTexturesRemoved).toEqual(0);
            expect(stats.numberOfBuffersRemoved).toEqual(0);
            expect(stats.numberOfProgramsRemoved).toEqual(0);
            expect(stats.numberOfImagesRemoved).toEqual(0);
            expect(stats.numberOfSamplersRemoved).toEqual(0);
            expect(stats.numberOfShadersRemoved).toEqual(0);
            done();
        });
    });
}); 