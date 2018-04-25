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
        var separateResources = {};
        var options = {
            separateBuffers : true,
            separateTextures : true,
            separateResources : separateResources
        };
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                ForEach.image(gltf, function(image) {
                    expect(image.bufferView).toBeUndefined();
                    expect(image.uri).toBe('image0.png');
                });
                expect(gltf.buffers.length).toBe(1);
                var buffer = gltf.buffers[0];
                expect(buffer.uri).toBe('buffer.bin');
                expect(Object.keys(separateResources).length).toBe(2);
                expect(Buffer.isBuffer(separateResources['buffer.bin']));
                expect(Buffer.isBuffer(separateResources['image0.png']));
                expect(gltf.bufferViews.length).toBe(originalBufferViewsLength - 1);
                expect(buffer.byteLength).toBeLessThan(originalByteLength);
            }), done).toResolve();
    });

    it('writes resources as files with object names', function(done) {
        var separateResources = {};
        var options = {
            separateBuffers : true,
            separateTextures : true,
            separateResources : separateResources
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
        var separateResources = {};
        var options = {
            name : 'my-gltf',
            separateBuffers : true,
            separateTextures : true,
            separateResources : separateResources
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
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                var image = gltf.images[0];
                expect(image.bufferView).toBeUndefined();
                expect(Buffer.isBuffer(dataUriToBuffer(image.uri)));
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));
                expect(gltf.bufferViews.length).toBe(originalBufferViewsLength - 1);
                expect(buffer.byteLength).toBeLessThan(originalByteLength);
            }), done).toResolve();
    });

    it('writes resources as bufferViews', function(done) {
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                var image = gltf.images[0];
                var bufferViewByteLength = gltf.bufferViews[image.bufferView].byteLength;
                var source = image.extras._pipeline.source;
                expect(image.bufferView).toBeDefined();
                expect(bufferViewByteLength).toBe(source.byteLength);
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));
                expect(gltf.bufferViews.length).toBe(originalBufferViewsLength);
                expect(buffer.byteLength).toBe(originalByteLength);
            }), done).toResolve();
    });
});
