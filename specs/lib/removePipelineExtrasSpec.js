'use strict';
var fs = require('fs');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var gltfExtrasPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestExtras.gltf';

describe('removePipelineExtras', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfExtrasPath, function(err, data) {
            gltf = JSON.parse(data);
            removePipelineExtras(gltf);
            done();
        });
    });

    it('did not modify objects with no extras', function() {
        expect(gltf.accessors.accessor_21.extras).not.toBeDefined();
        expect(gltf.animations.animation_0.extras).not.toBeDefined();
        expect(gltf.animations.animation_0.channels[0].extras).not.toBeDefined();
        expect(gltf.animations.animation_0.channels[0].target.extras).not.toBeDefined();
        expect(gltf.animations.animation_0.samplers.sampler.extras).not.toBeDefined();
        expect(gltf.asset.extras).not.toBeDefined();
        expect(gltf.asset.profile.extras).not.toBeDefined();
    });

    it('did not modify objects with empty extras', function() {
        expect(gltf.extras).toBeDefined();
        expect(Object.keys(gltf.extras).length).toEqual(0);
        expect(gltf.buffers.CesiumTexturedBoxTest.extras).toBeDefined();
        expect(Object.keys(gltf.buffers.CesiumTexturedBoxTest.extras).length).toEqual(0);
        expect(gltf.bufferViews.bufferView_29.extras).toBeDefined();
        expect(Object.keys(gltf.bufferViews.bufferView_29.extras).length).toEqual(0);
        expect(gltf.cameras.camera_0.extras).toBeDefined();
        expect(Object.keys(gltf.cameras.camera_0.extras).length).toEqual(0);
        expect(gltf.cameras.camera_0.orthographic.extras).toBeDefined();
        expect(Object.keys(gltf.cameras.camera_0.orthographic.extras).length).toEqual(0);
        expect(gltf.cameras.camera_0.perspective.extras).toBeDefined();
        expect(Object.keys(gltf.cameras.camera_0.perspective.extras).length).toEqual(0);
        expect(gltf.images.Image0001.extras).toBeDefined();
        expect(Object.keys(gltf.images.Image0001.extras).length).toEqual(0);
    });

    it('removed the entire extras', function() {
        expect(gltf.materials.EffectTexture.extras).not.toBeDefined();
        expect(gltf.meshes.mesh002.extras).not.toBeDefined();
        expect(gltf.meshes.mesh002.primitives.extras).not.toBeDefined();
        expect(gltf.nodes.mesh002Node.extras).not.toBeDefined();
        expect(gltf.programs.program_0.extras).not.toBeDefined();
        expect(gltf.samplers.sampler_0.extras).not.toBeDefined();
        expect(gltf.scenes.defaultScene.extras).not.toBeDefined();
    });

    it('only removed _pipeline', function() {
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline).not.toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.misc).toBeDefined();
        expect(gltf.skins.Armature_Cylinder_skin.extras._pipeline).not.toBeDefined();
        expect(gltf.skins.Armature_Cylinder_skin.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.extras._pipeline).not.toBeDefined();
        expect(gltf.techniques.technique0.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.parameters.diffuse.extras._pipeline).not.toBeDefined();
        expect(gltf.techniques.technique0.parameters.diffuse.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.states.extras._pipeline).not.toBeDefined();
        expect(gltf.techniques.technique0.states.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.states.functions.extras._pipeline).not.toBeDefined();
        expect(gltf.techniques.technique0.states.functions.extras.misc).toBeDefined();
        expect(gltf.textures.texture_Image0001.extras._pipeline).not.toBeDefined();
        expect(gltf.textures.texture_Image0001.extras.misc).toBeDefined();
    });
});