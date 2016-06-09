'use strict';

var fs = require('fs');
var removeUnused = require('../../lib/removeUnused');
var OptimizationStatistics = require('../../lib/OptimizationStatistics');
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestUnusedTree.gltf';

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
            expect(gltf.accessors['IBM_Armature_Cylinder-skin']).not.toBeDefined();
            expect(gltf.bufferViews.bufferView_30).not.toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest).not.toBeDefined();
            expect(gltf.cameras.camera_0).not.toBeDefined();
            expect(gltf.images.Image0001).not.toBeDefined();
            expect(gltf.materials['Effect-Texture']).not.toBeDefined();
            expect(gltf.meshes['Geometry-mesh002']).not.toBeDefined();
            expect(gltf.nodes['Geometry-mesh002Node']).not.toBeDefined();
            expect(gltf.nodes.groupLocator030Node).not.toBeDefined();
            expect(gltf.nodes.node_3).not.toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).not.toBeDefined();
            expect(gltf.programs.program_0).not.toBeDefined();
            expect(gltf.samplers.sampler_0).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0VS).not.toBeDefined();
            expect(gltf.skins['Armature_Cylinder-skin']).not.toBeDefined();
            expect(gltf.techniques.technique0).not.toBeDefined();
            expect(gltf.textures.texture_Image0001).not.toBeDefined();

            expect(stats.numberRemoved.nodes).toEqual(4);
            expect(stats.numberRemoved.skins).toEqual(1);
            expect(stats.numberRemoved.cameras).toEqual(1);
            expect(stats.numberRemoved.meshes).toEqual(1);
            expect(stats.numberRemoved.accessors).toEqual(3);
            expect(stats.numberRemoved.materials).toEqual(1);
            expect(stats.numberRemoved.bufferViews).toEqual(1);
            expect(stats.numberRemoved.techniques).toEqual(1);
            expect(stats.numberRemoved.textures).toEqual(1);
            expect(stats.numberRemoved.buffers).toEqual(1);
            expect(stats.numberRemoved.programs).toEqual(1);
            expect(stats.numberRemoved.images).toEqual(1);
            expect(stats.numberRemoved.samplers).toEqual(1);
            expect(stats.numberRemoved.shaders).toEqual(2);
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
            gltf.animations.animation_0.parameters['TIME'] = 'animAccessor_0';
            var stats = new OptimizationStatistics();
            removeUnused(gltf, stats);

            expect(gltf.accessors.accessor_23).toBeDefined();
            expect(gltf.accessors.animAccessor_0).toBeDefined();
            expect(gltf.accessors['IBM_Armature_Cylinder-skin']).toBeDefined();
            expect(gltf.bufferViews.bufferView_30).toBeDefined();
            expect(gltf.buffers.CesiumTexturedBoxTest).toBeDefined();
            expect(gltf.cameras.camera_0).toBeDefined();
            expect(gltf.images.Image0001).toBeDefined();
            expect(gltf.materials['Effect-Texture']).toBeDefined();
            expect(gltf.meshes['Geometry-mesh002']).toBeDefined();
            expect(gltf.nodes['Geometry-mesh002Node']).toBeDefined();
            expect(gltf.nodes.groupLocator030Node).toBeDefined();
            expect(gltf.nodes.node_3).toBeDefined();
            expect(gltf.nodes.txtrLocator026Node).toBeDefined();
            expect(gltf.programs.program_0).toBeDefined();
            expect(gltf.samplers.sampler_0).toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();
            expect(gltf.skins['Armature_Cylinder-skin']).toBeDefined();
            expect(gltf.techniques.technique0).toBeDefined();
            expect(gltf.textures.texture_Image0001).toBeDefined();

            expect(stats.numberRemoved.nodes).toEqual(0);
            expect(stats.numberRemoved.skins).toEqual(0);
            expect(stats.numberRemoved.cameras).toEqual(0);
            expect(stats.numberRemoved.meshes).toEqual(0);
            expect(stats.numberRemoved.accessors).toEqual(0);
            expect(stats.numberRemoved.materials).toEqual(0);
            expect(stats.numberRemoved.bufferViews).toEqual(0);
            expect(stats.numberRemoved.techniques).toEqual(0);
            expect(stats.numberRemoved.textures).toEqual(0);
            expect(stats.numberRemoved.buffers).toEqual(0);
            expect(stats.numberRemoved.programs).toEqual(0);
            expect(stats.numberRemoved.images).toEqual(0);
            expect(stats.numberRemoved.samplers).toEqual(0);
            expect(stats.numberRemoved.shaders).toEqual(0);
            done();
        });
    });
}); 