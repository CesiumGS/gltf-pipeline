'use strict';
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var gltfPipeline = require('../../lib/gltfPipeline');
var processJSON = gltfPipeline.processJSON;
var processJSONWithExtras = gltfPipeline.processJSONWithExtras;
var processJSONToDisk = gltfPipeline.processJSONToDisk;
var processFile = gltfPipeline.processFile;
var processFileToDisk = gltfPipeline.processFileToDisk;
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var outputPath = './output/';

describe('gltfPipeline', function() {
    it('optimizes a gltf JSON given an embedded JSON', function() {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSON(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });
    
    it('optimizes a gltf JSON given a resourcePath', function() {
        var gltf;
        var gltfCopy;
        var options = { 'resourcePath' : path.dirname(gltfPath) };
        fs.readFile(gltfPath, function(err, data) {
            if (err) {
                throw err;
            }
            gltf = JSON.parse(data);
            gltfCopy = clone(gltfCopy); 
            addPipelineExtras(gltf);
            
            processJSON(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });

    it('optimizes a gltf JSON with extras', function() {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSONWithExtras(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });
    
    it('optimizes a binary glTF JSON with extras', function() {
        var gltfCopy;
        var options = {};
        readGltf(glbPath, function(gltf) {
            gltfCopy = clone(gltf);
            processJSONWithExtras(gltf, options, function(gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });

    it('optimizes a glTF file', function() {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, function(gltf) {
            gltfCopy = gltf;
            processFile(gltfPath, options, function (gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });

    it('optimizes a glb file', function() {
        var gltfCopy;
        var options = {};
        readGltf(glbPath, function(gltf) {
            gltfCopy = gltf;
            processFile(glbPath, options, function (gltf) {
                expect(gltf).toBeDefined();
                expect(gltf).not.toBe(gltfCopy);
            });
        });
    });

    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {};
        processFileToDisk(gltfPath, outputPath, options, function() {
            expect(spy).toHaveBeenCalled();
            done();
        });
    });

    it('will write a file', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {};
        processFileToDisk(gltfPath, outputPath, options, function() {
            expect(spy).toHaveBeenCalled();
            done();
        });
    });

    
    it('will write a file from JSON', function(done) {
        var spy = spyOn(fs, 'writeFile').and.callFake(function(file, data, callback) {
            callback();
        });
        var options = {};
        readGltf(gltfPath, function(gltf) {
            processJSONToDisk(gltf, outputPath, options, function() {
                expect(spy).toHaveBeenCalled();
                done();
            });
        });
    });
});