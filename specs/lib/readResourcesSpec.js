'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var ForEach = require('../../lib/ForEach');
var parseGlb = require('../../lib/parseGlb');
var readResources = require('../../lib/readResources');

var RuntimeError = Cesium.RuntimeError;

var boxTexturedSeparate1Path = 'specs/data/1.0/box-textured-separate/box-textured-separate.gltf';
var boxTexturedBinarySeparate1Path = 'specs/data/1.0/box-textured-binary-separate/box-textured-binary-separate.glb';
var boxTexturedBinary1Path = 'specs/data/1.0/box-textured-binary/box-textured-binary.glb';
var boxTexturedEmbedded1Path = 'specs/data/1.0/box-textured-embedded/box-textured-embedded.gltf';
var boxTexturedSeparate2Path = 'specs/data/2.0/box-textured-separate/box-textured-separate.gltf';
var boxTexturedBinarySeparate2Path = 'specs/data/2.0/box-textured-binary-separate/box-textured-binary-separate.glb';
var boxTexturedBinary2Path = 'specs/data/2.0/box-textured-binary/box-textured-binary.glb';
var boxTexturedEmbedded2Path = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';
var boxTexturedTransparentPath = 'specs/data/2.0/box-textured-transparent/box-textured-transparent.gltf';

function readGltf(gltfPath, binary) {
    if (binary) {
        var glb = fsExtra.readFileSync(gltfPath);
        return parseGlb(glb);
    }
    return fsExtra.readJsonSync(gltfPath);
}

function checkPaths(object, resourceDirectory) {
    var pipelineExtras = object.extras._pipeline;
    var absolutePath = pipelineExtras.absolutePath;
    var relativePath = pipelineExtras.relativePath;
    expect(path.basename(relativePath)).toBe(relativePath);
    expect(absolutePath).toBe(path.join(resourceDirectory, relativePath));
    expect(object.name).toBe(path.basename(relativePath, path.extname(relativePath)));
}

function readsResources(gltfPath, binary, separate, done) {
    var gltf = readGltf(gltfPath, binary);
    var resourceDirectory = path.dirname(gltfPath);
    var options = {
        resourceDirectory: resourceDirectory
    };
    expect(readResources(gltf, options)
        .then(function(gltf) {
            ForEach.shader(gltf, function(shader) {
                var shaderText = shader.extras._pipeline.source;
                expect(typeof shaderText === 'string').toBe(true);
                expect(shaderText.length).toBeGreaterThan(0);
                expect(shader.uri).toBeUndefined();
                if (separate) {
                    checkPaths(shader, resourceDirectory);
                }
            });
            ForEach.image(gltf, function(image) {
                var imageSource = image.extras._pipeline.source;
                expect(Buffer.isBuffer(imageSource)).toBe(true);
                expect(image.uri).toBeUndefined();
                if (separate) {
                    checkPaths(image, resourceDirectory);
                }
            });
            ForEach.buffer(gltf, function(buffer) {
                var bufferSource = buffer.extras._pipeline.source;
                expect(Buffer.isBuffer(bufferSource)).toBe(true);
                expect(buffer.uri).toBeUndefined();
                if (separate && !binary) {
                    checkPaths(buffer, resourceDirectory);
                }
            });
        }), done).toResolve();
}

function checkTransparency(gltfPath, check, result) {
    var gltf = readGltf(gltfPath, false);
    var options = {
        resourceDirectory: path.dirname(gltfPath),
        checkTransparency: check
    };
    return readResources(gltf, options)
        .then(function(gltf) {
            ForEach.image(gltf, function(image) {
                expect(image.extras._pipeline.transparent).toBe(result);
            });
        });
}

describe('readResources', function() {
    it('reads separate resources from 1.0 model', function(done) {
        readsResources(boxTexturedSeparate1Path, false, true, done);
    });

    it('reads separate resources from 1.0 glb', function(done) {
        readsResources(boxTexturedBinarySeparate1Path, true, true, done);
    });

    it('reads embedded resources from 1.0 model', function(done) {
        readsResources(boxTexturedEmbedded1Path, false, false, done);
    });

    it('reads resources from 1.0 glb', function(done) {
        readsResources(boxTexturedBinary1Path, true, false, done);
    });

    it('reads separate resources from model', function(done) {
        readsResources(boxTexturedSeparate2Path, false, true, done);
    });

    it('reads separate resources from glb', function(done) {
        readsResources(boxTexturedBinarySeparate2Path, true, true, done);
    });

    it('reads embedded resources from model', function(done) {
        readsResources(boxTexturedEmbedded2Path, false, false, done);
    });

    it('reads resources from glb', function(done) {
        readsResources(boxTexturedBinary2Path, true, false, done);
    });

    it('checks transparency', function(done) {
        // Transparency is detected if the checkTransparency flag is passed in and the texture actually has transparency in it.
        var promises = Promise.all([
            checkTransparency(boxTexturedTransparentPath, false, false),
            checkTransparency(boxTexturedTransparentPath, true, true),
            checkTransparency(boxTexturedEmbedded2Path, false, false),
            checkTransparency(boxTexturedEmbedded2Path, true, false)
        ]);
        expect(promises, done).toResolve();
    });

    it('rejects if gltf contains separate resources but no resource directory is supplied', function(done) {
        var gltf = readGltf(boxTexturedSeparate2Path);
        expect(readResources(gltf), done).toRejectWith(RuntimeError);
    });

    it('rejects when loading resource outside of the resource directory when secure is true', function(done) {
        var gltf = readGltf(boxTexturedSeparate2Path);
        gltf.images[0].uri = '../cesium.png';
        expect(readResources(gltf), done).toRejectWith(RuntimeError);
    });
});
