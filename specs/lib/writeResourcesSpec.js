'use strict';
var fsExtra = require('fs-extra');
var dataUriToBuffer = require('../../lib/dataUriToBuffer');
var ForEach = require('../../lib/ForEach');
var readResources = require('../../lib/readResources');
var writeResources = require('../../lib/writeResources');

var Cesium = require('cesium');
var CesiumMath = Cesium.Math;

var gltfPath = 'specs/data/2.0/box-techniques-embedded/box-techniques-embedded.gltf';
var gltf;

describe('writeResources', function() {
    beforeEach(function(done) {
        var gltfLoaded = fsExtra.readJsonSync(gltfPath);
        return readResources(gltfLoaded)
            .then(function() {
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

    it('writes resources as files', function(done) {
        var separateResources = {};
        var options = {
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                ForEach.image(gltf, function(image) {
                    expect(image.bufferView).toBeUndefined();
                    expect(image.uri.indexOf('.png')).toBeGreaterThan(-1);
                });

                ForEach.shader(gltf, function (shader) {
                    expect(shader.bufferView).toBeUndefined();
                    expect(shader.uri.indexOf('.glsl')).toBeGreaterThan(-1);
                });

                expect(gltf.buffers.length).toBe(1);
                var buffer = gltf.buffers[0];
                expect(buffer.uri.indexOf('.bin')).toBeGreaterThan(-1);
                expect(Object.keys(separateResources).length).toBe(4);
                expect(Buffer.isBuffer(separateResources['buffer.bin']));
                expect(Buffer.isBuffer(separateResources['image0.png']));
                expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
                expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
            }), done).toResolve();
    });

    it('writes resources as files with object names', function(done) {
        var separateResources = {};
        var options = {
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };
        gltf.buffers[0].name = 'my-buffer';
        gltf.images[0].name = 'my-image';
        gltf.extensions.KHR_techniques_webgl.shaders[0].name = 'my-shader';
        expect(writeResources(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].uri).toBe('my-buffer.bin');
                expect(gltf.images[0].uri).toBe('my-image.png');
                expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe('my-shader.glsl');
            }), done).toResolve();
    });

    it('writes resources as files with gltf name when resources aren\'t named', function(done) {
        var separateResources = {};
        var options = {
            name: 'my-gltf',
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };

        delete gltf.buffers[0].name;
        delete gltf.images[0].name;
        delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
        delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

        expect(writeResources(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].uri).toBe('my-gltf.bin');
                expect(gltf.images[0].uri).toBe('my-gltf0.png');
                expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe('my-gltfFS0.glsl');
            }), done).toResolve();
    });

    it('writes resources as data uris', function(done) {
        var options = {
            dataUris: true
        };
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf, options)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

                ForEach.image(gltf, function (image) {
                    expect(image.bufferView).toBeUndefined();
                    expect(Buffer.isBuffer(dataUriToBuffer(image.uri)));
                });

                ForEach.shader(gltf, function (shader) {
                    expect(shader.bufferView).toBeUndefined();
                    expect(Buffer.isBuffer(dataUriToBuffer(shader.uri)));
                });

                expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
                expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
            }), done).toResolve();
    });

    it('writes resources as bufferViews', function(done) {
        var originalBufferViewsLength = gltf.bufferViews.length;
        var originalByteLength = gltf.buffers[0].byteLength;
        expect(writeResources(gltf)
            .then(function(gltf) {
                var buffer = gltf.buffers[0];
                expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

                var bufferViewByteLength = 0;
                var bufferView;
                var sourceByteLength;
                ForEach.image(gltf, function (image) {
                    expect(image.bufferView).toBeDefined();
                    bufferView = gltf.bufferViews[image.bufferView];
                    expect(bufferView).toBeDefined();
                    sourceByteLength = image.extras._pipeline.source.byteLength;
                    expect(sourceByteLength).toEqual(bufferView.byteLength);

                    bufferViewByteLength += bufferView.byteLength;
                });

                ForEach.shader(gltf, function (shader) {
                    expect(shader.bufferView).toBeDefined();
                    bufferView = gltf.bufferViews[shader.bufferView];
                    expect(bufferView).toBeDefined();
                    sourceByteLength = Buffer.byteLength(shader.extras._pipeline.source);
                    expect(sourceByteLength).toEqual(bufferView.byteLength);

                    bufferViewByteLength += bufferView.byteLength;
                });

                expect(gltf.bufferViews.length).toBe(originalBufferViewsLength);
                expect(CesiumMath.equalsEpsilon(buffer.byteLength, originalByteLength + bufferViewByteLength, 8)).toBe(true);
            }), done).toResolve();
    });
});
