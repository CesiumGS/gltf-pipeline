'use strict';
var clone = require('clone');
var fsExtra = require('fs-extra');
var path = require('path');

var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var readGltf = require('../../lib/readGltf');
var removeUnused = require('../../lib/removeUnused');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var outputGltfPath = './output/CesiumTexturedBoxTest.glb';
var invalidPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.exe';

describe('writeBinaryGltf', function() {
    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fsExtra, 'outputFile').and.callFake(function() {});
        var readOptions = {};
        var writeOptions = {
            outputPath : outputGltfPath,
            embed : true,
            embedImage : true,
            createDirectory : false
        };

        readGltf(gltfPath, readOptions)
            .then(function(gltf) {
                return writeBinaryGltf(gltf, writeOptions);
            })
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
                done();
            })
            .catch(function (err) {
                done();
                throw err;
            });
    });

    it('throws an invalid output path error', function(done) {
        var readOptions = {};
        var writeOptions = {
            outputPath : undefined,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        readGltf(gltfPath, readOptions)
            .then(function(gltf) {
                expect(function() {
                    writeBinaryGltf(gltf, writeOptions);
                }).toThrowError('Output path is undefined.');
                done();
            });
    });

    it('throws an invalid output extension error', function(done) {
        var readOptions = {};
        var writeOptions = {
            outputPath : invalidPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        readGltf(gltfPath, readOptions)
            .then(function(gltf) {
                expect(function() {
                    writeBinaryGltf(gltf, writeOptions);
                }).toThrowError('Invalid output path extension.');
                done();
            });
    });
});
