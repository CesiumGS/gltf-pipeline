'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const ForEach = require('../../lib/ForEach');
const parseGlb = require('../../lib/parseGlb');
const readResources = require('../../lib/readResources');

const RuntimeError = Cesium.RuntimeError;

const boxTexturedSeparate1Path = 'specs/data/1.0/box-textured-separate/box-textured-separate.gltf';
const boxTexturedBinarySeparate1Path = 'specs/data/1.0/box-textured-binary-separate/box-textured-binary-separate.glb';
const boxTexturedBinary1Path = 'specs/data/1.0/box-textured-binary/box-textured-binary.glb';
const boxTexturedEmbedded1Path = 'specs/data/1.0/box-textured-embedded/box-textured-embedded.gltf';
const boxTexturedSeparate2Path = 'specs/data/2.0/box-textured-separate/box-textured-separate.gltf';
const boxTexturedBinarySeparate2Path = 'specs/data/2.0/box-textured-binary-separate/box-textured-binary-separate.glb';
const boxTexturedBinary2Path = 'specs/data/2.0/box-textured-binary/box-textured-binary.glb';
const boxTexturedEmbedded2Path = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';

function readGltf(gltfPath, binary) {
    if (binary) {
        const glb = fsExtra.readFileSync(gltfPath);
        return parseGlb(glb);
    }
    return fsExtra.readJsonSync(gltfPath);
}

function checkPaths(object, resourceDirectory) {
    const pipelineExtras = object.extras._pipeline;
    const absolutePath = pipelineExtras.absolutePath;
    const relativePath = pipelineExtras.relativePath;
    expect(path.basename(relativePath)).toBe(relativePath);
    expect(absolutePath).toBe(path.join(resourceDirectory, relativePath));
    expect(object.name).toBe(path.basename(relativePath, path.extname(relativePath)));
}

function readsResources(gltfPath, binary, separate, done) {
    const gltf = readGltf(gltfPath, binary);
    const resourceDirectory = path.dirname(gltfPath);
    const options = {
        resourceDirectory: resourceDirectory
    };
    expect(readResources(gltf, options)
        .then(function(gltf) {
            ForEach.shader(gltf, function(shader) {
                const shaderText = shader.extras._pipeline.source;
                expect(typeof shaderText === 'string').toBe(true);
                expect(shaderText.length).toBeGreaterThan(0);
                expect(shader.uri).toBeUndefined();
                if (separate) {
                    checkPaths(shader, resourceDirectory);
                }
            });
            ForEach.image(gltf, function(image) {
                const imageSource = image.extras._pipeline.source;
                expect(Buffer.isBuffer(imageSource)).toBe(true);
                expect(image.uri).toBeUndefined();
                if (separate) {
                    checkPaths(image, resourceDirectory);
                }
            });
            ForEach.buffer(gltf, function(buffer) {
                const bufferSource = buffer.extras._pipeline.source;
                expect(Buffer.isBuffer(bufferSource)).toBe(true);
                expect(buffer.uri).toBeUndefined();
                if (separate && !binary) {
                    checkPaths(buffer, resourceDirectory);
                }
            });
        }), done).toResolve();
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

    it('rejects if gltf contains separate resources but no resource directory is supplied', function(done) {
        const gltf = readGltf(boxTexturedSeparate2Path);
        expect(readResources(gltf), done).toRejectWith(RuntimeError);
    });

    it('rejects when loading resource outside of the resource directory when secure is true', function(done) {
        const gltf = readGltf(boxTexturedSeparate2Path);
        gltf.images[0].uri = '../cesium.png';
        const options = {
            secure : true,
            resourceDirectory : 'specs/data/2.0/box-textured-separate'
        };
        expect(readResources(gltf, options), done).toRejectWith(RuntimeError);
    });
});
