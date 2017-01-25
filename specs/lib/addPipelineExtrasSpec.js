'use strict';
var fs = require('fs');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var gltfExtrasPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestAddExtras.gltf';

describe('addPipelineExtras', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfExtrasPath, function(err, data) {
            if (err) {
                throw err;
            }
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
            done();
        });
    });

    it('added an extras object to objects without extras', function() {
        expect(gltf.accessors.accessor_21.extras._pipeline).toBeDefined();
        expect(gltf.animations.animation_0.extras._pipeline).toBeDefined();
        expect(gltf.animations.animation_0.channels[0].extras._pipeline).toBeDefined();
        expect(gltf.animations.animation_0.channels[0].target.extras._pipeline).toBeDefined();
        expect(gltf.animations.animation_0.samplers.sampler.extras._pipeline).toBeDefined();
        expect(gltf.asset.extras._pipeline).toBeDefined();
        expect(gltf.asset.profile.extras._pipeline).toBeDefined();
        expect(gltf.extras._pipeline).toBeDefined();
        expect(gltf.buffers.CesiumTexturedBoxTest.extras._pipeline).toBeDefined();
        expect(gltf.bufferViews.bufferView_29.extras._pipeline).toBeDefined();
        expect(gltf.cameras.camera_0.extras._pipeline).toBeDefined();
        expect(gltf.cameras.camera_0.orthographic.extras._pipeline).toBeDefined();
        expect(gltf.cameras.camera_0.perspective.extras._pipeline).toBeDefined();
        expect(gltf.images.Image0001.extras._pipeline).toBeDefined();
    });

    it('added a _pipeline object to existing extras', function() {
        expect(gltf.materials.EffectTexture.extras._pipeline).toBeDefined();
        expect(gltf.meshes.mesh002.extras._pipeline).toBeDefined();
        expect(gltf.meshes.mesh002.primitives[0].extras._pipeline).toBeDefined();
        expect(gltf.nodes.mesh002Node.extras._pipeline).toBeDefined();
        expect(gltf.programs.program_0.extras._pipeline).toBeDefined();
        expect(gltf.samplers.sampler_0.extras._pipeline).toBeDefined();
        expect(gltf.scenes.defaultScene.extras._pipeline).toBeDefined();
    });

    it('did not overwrite existing extras objects', function() {
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.misc).toBeDefined();
        expect(gltf.skins.Armature_Cylinder_skin.extras._pipeline).toBeDefined();
        expect(gltf.skins.Armature_Cylinder_skin.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.extras._pipeline).toBeDefined();
        expect(gltf.techniques.technique0.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.parameters.diffuse.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.states.extras._pipeline).toBeDefined();
        expect(gltf.techniques.technique0.states.extras.misc).toBeDefined();
        expect(gltf.techniques.technique0.states.functions.extras._pipeline).toBeDefined();
        expect(gltf.techniques.technique0.states.functions.extras.misc).toBeDefined();
        expect(gltf.textures.texture_Image0001.extras._pipeline).toBeDefined();
        expect(gltf.textures.texture_Image0001.extras.misc).toBeDefined();
    });

    it('does not attempt to add extras to null objects', function() {
        gltf.accessors.accessor_25 = {
            "bufferView": "bufferView_29",
            "byteOffset": 0,
            "componentType": 5123,
            "count": 36,
            "type": "SCALAR",
            "min": [
                null,
                null,
                null
            ],
            "max": [
                null,
                null,
                null
            ]
        };
        addPipelineExtras(gltf);
        expect(gltf.accessors.accessor_25).toBeDefined();
    });
});