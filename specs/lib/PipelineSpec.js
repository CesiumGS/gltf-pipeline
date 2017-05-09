'use strict';
var clone = require('clone');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var mergeDuplicateVertices = require('../../lib/mergeDuplicateVertices');
var Pipeline = require('../../lib/Pipeline');
var readGltf = require('../../lib/readGltf');

var processFile = Pipeline.processFile;
var processFileToDisk = Pipeline.processFileToDisk;
var processJSON = Pipeline.processJSON;
var processJSONToDisk = Pipeline.processJSONToDisk;
var processJSONWithExtras = Pipeline.processJSONWithExtras;

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var outputGltfPath = './output/CesiumTexturedBoxTest.gltf';
var outputGlbPath = './output/CesiumTexturedBoxTest.glb';

describe('Pipeline', function() {
    it('optimizes a gltf JSON with embedded resources', function(done) {
        var gltfCopy;
        expect(fsExtraReadFile(gltfEmbeddedPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                gltfCopy = clone(gltfCopy);
                return processJSON(gltf);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                expect(gltf.scenes.defaultScene.extras).toBeUndefined();
            }), done).toResolve();
    });

    it('optimizes a gltf JSON with external resources', function(done) {
        var options = {
            basePath : path.dirname(gltfPath)
        };
        var gltfCopy;
        expect(fsExtraReadFile(gltfPath, options)
            .then(function(data) {
                var gltf = JSON.parse(data);
                gltfCopy = clone(gltfCopy);
                return processJSON(gltf, options);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                expect(gltf.scenes.defaultScene.extras).toBeUndefined();
            }), done).toResolve();
    });

    it('optimizes a glTF file', function(done) {
        var gltfCopy;
        expect(readGltf(gltfPath)
            .then(function(gltf) {
                gltfCopy = clone(gltf);
                return processFile(gltfPath);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                expect(gltf.scenes.defaultScene.extras).toBeUndefined();
            }), done).toResolve();
    });

    it('optimizes a glb file', function(done) {
        var gltfCopy;
        expect(readGltf(glbPath)
            .then(function(gltf) {
                gltfCopy = clone(gltf);
                return processFile(glbPath);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                expect(gltf.scenes.defaultScene.extras).toBeUndefined();
            }), done).toResolve();
    });

    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fsExtra, 'outputJsonAsync').and.callFake(function() {});
        var options = {
            createDirectory : false
        };
        expect(processFileToDisk(gltfPath, outputGltfPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
            })
            .catch(function(err) {
                throw err;
            }), done).toResolve();
    });

    it('will write a binary file', function(done) {
        var spy = spyOn(fsExtra, 'outputFileAsync').and.callFake(function() {});
        var options = {
            binary : true,
            createDirectory : false
        };
        expect(processFileToDisk(gltfPath, outputGlbPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGlbPath));
            })
            .catch(function(err) {
                throw err;
            }), done).toResolve();

    });

    it('will write a file from JSON', function(done) {
        var spy = spyOn(fsExtra, 'outputJsonAsync').and.callFake(function() {});
        var processOptions = {
            createDirectory : false,
            basePath : path.dirname(gltfPath)
        };
        expect(readGltf(gltfPath)
            .then(function(gltf) {
                return processJSONToDisk(gltf, outputGltfPath, processOptions);
            })
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
            })
            .catch(function(err) {
                throw err;
            }), done).toResolve();
    });

    it('will write sources from JSON', function(done) {
        var initialUri;
        expect(readGltf(gltfEmbeddedPath)
            .then(function(gltf) {
                initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                return processJSON(gltf);
            })
            .then(function(gltf) {
                var firstBufferId = Object.keys(gltf.buffers)[0];
                var testBuffer = gltf.buffers[firstBufferId];
                var finalUri = testBuffer.uri;
                expect(initialUri).not.toEqual(finalUri);
            }), done).toResolve();
    });

    it('will write sources from file', function(done) {
        var initialUri;
        expect(readGltf(gltfEmbeddedPath)
            .then(function(gltf) {
                initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                return processFile(gltfEmbeddedPath);
            })
            .then(function(gltfFinal) {
                var firstBufferId = Object.keys(gltfFinal.buffers)[0];
                var testBuffer = gltfFinal.buffers[firstBufferId];
                var finalUri = testBuffer.uri;
                expect(initialUri).not.toEqual(finalUri);
            }), done).toResolve();
    });

    it('processJSONWithExtras does not merge duplicate vertices by default', function (done) {
        spyOn(mergeDuplicateVertices, '_implementation').and.callThrough();
        var promise = readGltf(gltfPath)
            .then(function (gltf) {
                return processJSONWithExtras(gltf);
            })
            .then(function () {
                expect(mergeDuplicateVertices._implementation).not.toHaveBeenCalled();
            });
        expect(promise, done).toResolve();
    });

    it('processJSONWithExtras can merge duplicate vertices.', function (done) {
        spyOn(mergeDuplicateVertices, '_implementation').and.callThrough();
        var promise = readGltf(gltfPath)
            .then(function (gltf) {
                return processJSONWithExtras(gltf, {mergeVertices: true}).thenReturn(gltf);
            })
            .then(function (gltf) {
                expect(mergeDuplicateVertices._implementation).toHaveBeenCalledWith(gltf);
            });
        expect(promise, done).toResolve();
    });
});
