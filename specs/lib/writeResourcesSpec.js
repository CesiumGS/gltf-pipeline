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

// TODO : tests for shaders

describe('writeResources', function() {
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

    it('writes resources as files with default names', function(done) {
        var externalResources = {};
        var options = {
            separateBuffers : true,
            separateTextures : true,
            externalResources : externalResources
        };
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                ForEach.image(gltf, function(image) {
                    expect(image.bufferView).toBeUndefined();
                    expect(image.uri).toBe('image0.png');
                });
                expect(gltf.buffers.length).toBe(1);
                var buffer = gltf.buffers[0];
                expect(buffer.uri).toBe('buffer.bin');
                expect(Object.keys(externalResources).length).toBe(2);
                expect(Buffer.isBuffer(externalResources['buffer.bin']));
                expect(Buffer.isBuffer(externalResources['image0.png']));
            }), done).toResolve();
    });

    it('writes resources as files with object names', function(done) {
        var externalResources = {};
        var options = {
            separateBuffers : true,
            separateTextures : true,
            externalResources : externalResources
        };
        gltf.buffers[0].name = 'my-buffer';
        gltf.images[0].name = 'my-image';
        expect(writeResources(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].uri).toBe('my-buffer.bin');
                expect(gltf.images[0].uri).toBe('my-image.png');
            }), done).toResolve();
    });

    it('writes resources as files with gltf name', function(done) {
        var externalResources = {};
        var options = {
            name : 'my-gltf',
            separateBuffers : true,
            separateTextures : true,
            externalResources : externalResources
        };
        expect(writeResources(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].uri).toBe('my-gltf.bin');
                expect(gltf.images[0].uri).toBe('my-gltf0.png');
            }), done).toResolve();
    });
    it('writes resources as data uris', function(done) {
        var options = {
            dataUris : true
        };
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                var image = gltf.images[0];
                expect(image.bufferView).toBeUndefined();
                expect(Buffer.isBuffer(dataUriToBuffer(image.uri)));
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));
            }), done).toResolve();
    });

    it('writes resources as bufferViews', function(done) {
        expect(writeResources(gltf)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                var image = gltf.images[0];
                var bufferViewByteLength = gltf.bufferViews[image.bufferView].byteLength;
                var source = image.extras._pipeline.source;
                expect(image.bufferView).toBeDefined();
                expect(bufferViewByteLength).toBe(source.byteLength);
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));
            }), done).toResolve();
    });
});
