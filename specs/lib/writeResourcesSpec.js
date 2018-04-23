'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var dataUriToBuffer = require('../../lib/dataUriToBuffer');
var ForEach = require('../../lib/ForEach');
var readResources = require('../../lib/readResources');
var writeResources = require('../../lib/writeResources');

var gltfPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';
var gltf;
// separateBuffer writes separate buffers (and nothing else)
// separateShaders writes separate shaders (and nothing else)
// separateTextures writes separate textures (and nothing else)
// dataUri is used instead of bfferviews
// bufferstorage supplied,
// external resources supplied (part of above really)

// TODO : test for shaders

fdescribe('writeResources', function() {
    beforeEach(function(done) {
        var gltfLoaded = fsExtra.readJsonSync(gltfPath);
        return Promise.all([
            addPipelineExtras(gltfLoaded),
            readResources(gltfLoaded)
        ]).then(function() {
            gltf = gltfLoaded;
            done();
        });
    });

    it('writes embedded resources', function(done) {
        expect(writeResources(gltf)
            .then(function(gltf) {
                ForEach.image(gltf, function(image) {
                    expect(image.bufferView).toBeDefined();
                    expect(image.uri).toBeUndefined();
                });
                expect(gltf.buffers.length).toBe(1);
                var buffer = gltf.buffers[0];
                var contents = dataUriToBuffer(buffer.uri);
                expect(contents.byteLength).toBe(buffer.byteLength);
            }), done).toResolve();
    });

    it('writes external resources', function(done) {
        var options = {
            separateBuffers : true,
            separateShaders : true,
            separateTextures : true,
            externalResources : {}
        };
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                ForEach.image(gltf, function(image) {
                    expect(image.bufferView).toBeUndefined();
                    expect(image.uri).toBe('cesium.png');
                });
                expect(gltf.buffers.length).toBe(1);
                var buffer = gltf.buffers[0];
                expect(buffer.uri).toBe('0.bin'); // TODO : don't actually name 0.bin
            }), done).toResolve();
    });
});
