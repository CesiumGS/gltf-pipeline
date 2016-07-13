'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var clone = require('clone');
var gltfPipeline = require('../../lib/gltfPipeline');
var processJSON = gltfPipeline.processJSON;
var processJSONToDisk = gltfPipeline.processJSONToDisk;
var processFile = gltfPipeline.processFile;
var processFileToDisk = gltfPipeline.processFileToDisk;
var readGltf = require('../../lib/readGltf');
var addPipelineExtras = require('../../lib/addPipelineExtras');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var outputGltfPath = './output/CesiumTexturedBoxTest.gltf';
var outputGlbPath = './output/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf JSON with embedded resources', function(done) {
        var options = {};
        readGltf(gltfEmbeddedPath, options, function(gltf) {
            var gltfCopy = clone(gltf);
            processJSON(gltf, options, function (gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
        });
    });
    
    it('optimizes a gltf JSON with external resources', function(done) {
        var options = { basePath : path.dirname(gltfPath) };
        fsExtra.readFile(gltfPath, options, function(err, data) {
            if (err) {
                throw err;
            }
            var gltf = JSON.parse(data);
            var gltfCopy = clone(gltfCopy); 
            addPipelineExtras(gltf);
            
            processJSON(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
        });
    });

    it('optimizes a glTF file', function(done) {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            gltfCopy = clone(gltf);
            processFile(gltfPath, options, function (gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
        });
    });

    it('optimizes a glb file', function(done) {
        var options = {};
        readGltf(glbPath, options, function(gltf) {
            var gltfCopy = clone(gltf);
            processFile(glbPath, options, function (gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
        });
    });

    it('will write a file to the correct directory', function() {
        var spy = spyOn(fsExtra, 'outputJson').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {
            createDirectory : false
        };
        processFileToDisk(gltfPath, outputGltfPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
            });
    });

    it('will write a binary file', function() {
        var spy = spyOn(fsExtra, 'outputFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {
            binary : true,
            createDirectory : false
        };
        processFileToDisk(gltfPath, outputGlbPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGlbPath));
            });
    });

    it('will write a file from JSON', function() {
        var spy = spyOn(fsExtra, 'outputJson').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {
            createDirectory : false,
            basePath : path.dirname(gltfPath)
        };
        readGltf(gltfPath, options, function(gltf) {
            processJSONToDisk(gltf, outputGltfPath, options)
                .then(function() {
                    expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
                });
        });
    });

    it('will write sources from JSON', function(done) {
        var options = {};
        readGltf(gltfEmbeddedPath, options, function (gltf) {
            var initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
            processJSON(gltf, options, function () {
                var finalUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                expect(initialUri).not.toEqual(finalUri);
                done();
            });
        });
    });

    it('will write sources from file', function(done) {
        var options = {};
        readGltf(gltfEmbeddedPath, options, function (gltf) {
            var initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
            processFile(gltfEmbeddedPath, options, function (gltfFinal) {
                var finalUri = gltfFinal.buffers.CesiumTexturedBoxTest.uri;
                expect(initialUri).not.toEqual(finalUri);
                done();
            });
        });
    });
});
