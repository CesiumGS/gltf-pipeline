'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const readResources = require('../../lib/readResources');
const compressDracoMeshes = require('../../lib/compressDracoMeshes');

const clone = Cesium.clone;

const boxPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';
const boxMorphPath = 'specs/data/2.0/box-morph/box-morph.gltf';
const multipleBoxesPath = 'specs/data/2.0/multiple-boxes/multiple-boxes.gltf';

let gltf;
let gltfOther;

function expectOutOfRange(gltf, name, value) {
    const options = {
        dracoOptions: {}
    };
    options.dracoOptions[name] = value;
    expect(function() {
        compressDracoMeshes(gltf, options);
    }).toThrowDeveloperError();
}

function readGltf(gltfPath) {
    const gltf = fsExtra.readJsonSync(gltfPath);
    return readResources(gltf);
}

function readGltfs(paths) {
    return Promise.map(paths, function(path) {
        return readGltf(path);
    });
}

function getDracoBuffer(gltf) {
    const bufferView = gltf.bufferViews[gltf.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression.bufferView];
    const source = gltf.buffers[0].extras._pipeline.source;
    return source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
}

describe('compressDracoMeshes', function() {
    beforeEach(function(done) {
        return readGltfs([boxPath, boxPath])
            .then(function(gltfs) {
                gltf = gltfs[0];
                gltfOther = gltfs[1];
                done();
            });
    });

    it('compresses meshes with default options', function() {
        expect(gltf.accessors.length).toBe(4); // 3 attributes + indices
        expect(gltf.bufferViews.length).toBe(4); // position/normal + texcoord + indices + image

        compressDracoMeshes(gltf);

        expect(gltf.accessors.length).toBe(4); // accessors are not removed
        expect(gltf.bufferViews.length).toBe(2); // draco + image

        const dracoExtension = gltf.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression;
        expect(dracoExtension.bufferView).toBeDefined();
        expect(gltf.extensionsUsed.indexOf('KHR_draco_mesh_compression') >= 0).toBe(true);
        expect(gltf.extensionsRequired.indexOf('KHR_draco_mesh_compression') >= 0).toBe(true);

        const positionAccessor = gltf.accessors[dracoExtension.attributes.POSITION];
        const normalAccessor = gltf.accessors[dracoExtension.attributes.NORMAL];
        const texcoordAccessor = gltf.accessors[dracoExtension.attributes.TEXCOORD_0];

        expect(positionAccessor.bufferView).toBeUndefined();
        expect(positionAccessor.byteLength).toBeUndefined();
        expect(normalAccessor.bufferView).toBeUndefined();
        expect(normalAccessor.byteLength).toBeUndefined();
        expect(texcoordAccessor.bufferView).toBeUndefined();
        expect(texcoordAccessor.byteLength).toBeUndefined();
    });

    it('throws if quantize bits is out of range', function() {
        expectOutOfRange(gltf, 'compressionLevel', -1);
        expectOutOfRange(gltf, 'compressionLevel', 11);
        expectOutOfRange(gltf, 'quantizePositionBits', -1);
        expectOutOfRange(gltf, 'quantizePositionBits', 31);
        expectOutOfRange(gltf, 'quantizeNormalBits', -1);
        expectOutOfRange(gltf, 'quantizeNormalBits', 31);
        expectOutOfRange(gltf, 'quantizeTexcoordBits', -1);
        expectOutOfRange(gltf, 'quantizeTexcoordBits', 31);
        expectOutOfRange(gltf, 'quantizeColorBits', -1);
        expectOutOfRange(gltf, 'quantizeColorBits', 31);
        expectOutOfRange(gltf, 'quantizeGenericBits', -1);
        expectOutOfRange(gltf, 'quantizeGenericBits', 31);
    });

    it('applies unified quantization', function(done) {
        expect(readGltfs([multipleBoxesPath, multipleBoxesPath])
            .then(function(gltfs) {
                const gltfUnified = gltfs[0];
                const gltfNonUnified = gltfs[1];
                compressDracoMeshes(gltfUnified, {
                    dracoOptions: {
                        unifiedQuantization: true
                    }
                });
                compressDracoMeshes(gltfNonUnified, {
                    dracoOptions: {
                        unifiedQuantization: false
                    }
                });
                const dracoBufferUnified = getDracoBuffer(gltfUnified);
                const dracoBufferNonUnified = getDracoBuffer(gltfNonUnified);
                expect(dracoBufferNonUnified).not.toEqual(dracoBufferUnified);
            }), done).toResolve();
    });

    it('applies quantization bits', function() {
        compressDracoMeshes(gltf, {
            dracoOptions: {
                quantizePositionBits: 8
            }
        });
        compressDracoMeshes(gltfOther, {
            dracoOptions: {
                quantizePositionBits: 25
            }
        });

        const dracoBuffer8 = getDracoBuffer(gltf);
        const dracoBuffer14 = getDracoBuffer(gltfOther);
        expect(dracoBuffer8.length).toBeLessThan(dracoBuffer14.length);
    });

    it('does not quantize when quantize bits is 0', function() {
        compressDracoMeshes(gltf, {
            dracoOptions: {
                quantizePositionBits: 0,
                quantizeNormalBits: 0,
                quantizeTexcoordBits: 0,
                quantizeColorBits: 0,
                quantizeGenericBits: 0
            }
        });
        compressDracoMeshes(gltfOther);
        const dracoBufferUncompressed = getDracoBuffer(gltf);
        const dracoBufferCompressed = getDracoBuffer(gltfOther);
        expect(dracoBufferCompressed.length).toBeLessThan(dracoBufferUncompressed.length);
    });

    it('only compresses duplicate primitive once', function() {
        const primitives = gltf.meshes[0].primitives;
        primitives.push(clone(primitives[0], true));
        compressDracoMeshes(gltf);
        expect(primitives[0]).toEqual(primitives[1]);
    });

    function removeMorphTargets(gltf) {
        const mesh = gltf.meshes[0];
        const primitive = mesh.primitives[0];
        delete primitive.targets;
        delete mesh.weights;
        return gltf;
    }

    it('applied sequential encoding when the primitive has morph targets', function(done) {
        expect(readGltfs([boxMorphPath, boxMorphPath])
            .then(function(gltfs) {
                const gltfMorph = gltfs[0];
                const gltfNoMorph = removeMorphTargets(gltfs[1]);
                compressDracoMeshes(gltfMorph);
                compressDracoMeshes(gltfNoMorph);
                const dracoBufferMorph = getDracoBuffer(gltfMorph);
                const dracoBufferNoMorph = getDracoBuffer(gltfNoMorph);
                expect(dracoBufferMorph).not.toEqual(dracoBufferNoMorph);
            }), done).toResolve();
    });

    it('applies uncompressed fallback', function() {
        compressDracoMeshes(gltf, {
            dracoOptions: {
                uncompressedFallback: true
            }
        });
        compressDracoMeshes(gltfOther, {
            dracoOptions: {
                uncompressedFallback: false
            }
        });

        expect(gltf.extensionsUsed.indexOf('KHR_draco_mesh_compression') >= 0).toBe(true);
        expect(gltf.extensionsRequired).toBeUndefined();
        expect(gltfOther.extensionsUsed.indexOf('KHR_draco_mesh_compression') >= 0).toBe(true);
        expect(gltfOther.extensionsRequired.indexOf('KHR_draco_mesh_compression') >= 0).toBe(true);
        expect(gltf.buffers.length).toBe(6); // draco + image + 4 uncompressed attributes
        expect(gltfOther.buffers.length).toBe(2); // draco + image

        expect(gltf.buffers[0].extras._pipeline.mergedBufferName).toBeUndefined();
        expect(gltf.buffers[1].extras._pipeline.mergedBufferName).toBe('draco');
        expect(gltf.buffers[2].extras._pipeline.mergedBufferName).toBe('uncompressed');
        expect(gltf.buffers[3].extras._pipeline.mergedBufferName).toBe('uncompressed');
        expect(gltf.buffers[4].extras._pipeline.mergedBufferName).toBe('uncompressed');
        expect(gltf.buffers[5].extras._pipeline.mergedBufferName).toBe('uncompressed');

        expect(gltfOther.buffers[0].extras._pipeline.mergedBufferName).toBeUndefined();
        expect(gltfOther.buffers[1].extras._pipeline.mergedBufferName).toBeUndefined();
    });
});
