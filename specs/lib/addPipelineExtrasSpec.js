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
        expect(gltf.accessors[0].extras._pipeline).toBeDefined();
        expect(gltf.animations[0].extras._pipeline).toBeDefined();
        expect(gltf.animations[0].channels[0].extras._pipeline).toBeDefined();
        expect(gltf.animations[0].channels[0].target.extras._pipeline).toBeDefined();
        expect(gltf.animations[0].samplers[0].extras._pipeline).toBeDefined();
        expect(gltf.asset.extras._pipeline).toBeDefined();
        expect(gltf.asset.profile.extras._pipeline).toBeDefined();
        expect(gltf.extras._pipeline).toBeDefined();
        expect(gltf.buffers[0].extras._pipeline).toBeDefined();
        expect(gltf.bufferViews[0].extras._pipeline).toBeDefined();
        expect(gltf.cameras[0].extras._pipeline).toBeDefined();
        expect(gltf.cameras[0].orthographic.extras._pipeline).toBeDefined();
        expect(gltf.cameras[0].perspective.extras._pipeline).toBeDefined();
        expect(gltf.images[0].extras._pipeline).toBeDefined();
    });

    it('added a _pipeline object to existing extras', function() {
        expect(gltf.materials[0].extras._pipeline).toBeDefined();
        expect(gltf.meshes[0].extras._pipeline).toBeDefined();
        expect(gltf.meshes[0].primitives[0].extras._pipeline).toBeDefined();
        expect(gltf.nodes[0].extras._pipeline).toBeDefined();
        expect(gltf.programs[0].extras._pipeline).toBeDefined();
        expect(gltf.samplers[0].extras._pipeline).toBeDefined();
        expect(gltf.scenes[0].extras._pipeline).toBeDefined();
    });

    it('did not overwrite existing extras objects', function() {
        expect(gltf.shaders[0].extras._pipeline).toBeDefined();
        expect(gltf.shaders[0].extras.misc).toBeDefined();
        expect(gltf.skins[0].extras._pipeline).toBeDefined();
        expect(gltf.skins[0].extras.misc).toBeDefined();
        expect(gltf.techniques[0].extras._pipeline).toBeDefined();
        expect(gltf.techniques[0].extras.misc).toBeDefined();
        expect(gltf.techniques[0].parameters.diffuse.extras.misc).toBeDefined();
        expect(gltf.techniques[0].states.extras._pipeline).toBeDefined();
        expect(gltf.techniques[0].states.extras.misc).toBeDefined();
        expect(gltf.techniques[0].states.functions.extras._pipeline).toBeDefined();
        expect(gltf.techniques[0].states.functions.extras.misc).toBeDefined();
        expect(gltf.textures[0].extras._pipeline).toBeDefined();
        expect(gltf.textures[0].extras.misc).toBeDefined();
    });

    it('does not attempt to add extras to null objects', function() {
        gltf.accessors.push({
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
        });
        var accessorId = gltf.accessors.length - 1;
        addPipelineExtras(gltf);
        expect(gltf.accessors[accessorId]).toBeDefined();
    });
});