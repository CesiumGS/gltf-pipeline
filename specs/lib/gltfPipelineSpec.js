'use strict';
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var gltfPipeline = require('../../lib/gltfPipeline');
var processJSON = gltfPipeline.processJSON;
var processJSONToDisk = gltfPipeline.processJSONToDisk;
var processFile = gltfPipeline.processFile;
var processFileToDisk = gltfPipeline.processFileToDisk;
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var writeSource = require('../../lib/writeSource');
var writeGltf = require('../../lib/writeGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var outputPath = './output/';

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
        fs.readFile(gltfPath, options, function(err, data) {
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

    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {};
        processFileToDisk(gltfPath, outputPath, options, function() {
            expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize('output/output'));
            done();
        });
    });

    it('will write a binary file', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {
            binary : true
        };
        processFileToDisk(gltfPath, outputPath, options, function() {
            expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize('output/output.glb'));
            done();
        });
    });

    it('will write a file from JSON', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {
            createDirectory : false,
        };
        readGltf(gltfPath, options, function(gltf) {
            var options = { basePath : path.dirname(gltfPath) };
            processJSONToDisk(gltf, outputPath, options, function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize('output/output'));
                done();
            });
        });
    });

    it('will write sources from JSON', function(done) {
        var options = {};
        readGltf(gltfPath, options, function (gltf) {
            var initialSource = gltf['buffers'].CesiumTexturedBoxTest.extras._pipeline.source;
            processJSON(gltf, options, function () {
                var finalSource = gltf['buffers'].CesiumTexturedBoxTest.extras._pipeline.source;
                expect(initialSource).not.toEqual(finalSource);
                done();
            });
        });
    });

    it('will write sources from file', function(done) {
        var options = {};
        readGltf(gltfPath, options, function (gltf) {
            var initialSource = gltf['buffers'].CesiumTexturedBoxTest.extras._pipeline.source;
            processFile(gltfPath, options, function (gltfFinal) {
                var finalSource = gltfFinal['buffers'].CesiumTexturedBoxTest.extras._pipeline.source;
                expect(initialSource).not.toEqual(finalSource);
                done();
            });
        });
    });

    it('will add image processing extras if this is a pipeline with image processing', function(done) {
        var options = {
            imageProcess : true,
        };
        readGltf(gltfEmbeddedPath, options, function(gltf) {
            processJSON(gltf, options, function (gltf) {
                expect(gltf).toBeDefined();
                var images = gltf.images;
                for (var imageID in images) {
                    if (images.hasOwnProperty(imageID)) {
                        var extras = images[imageID].extras._pipeline;
                        expect(extras.jimpImage).toBeDefined();
                        expect(extras.imageChanged).toBe(false);
                    }
                }
                done();
            });
        });
    });
});
