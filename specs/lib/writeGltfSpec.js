'use strict';
var fsExtra = require('fs-extra');
var path = require('path');

var readGltf = require('../../lib/readGltf');
var writeGltf = require('../../lib/writeGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest_BinaryInput.gltf';
var outputGltfPath = './output/CesiumTexturedBoxTest.gltf';
var invalidPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.exe';

describe('writeGltf', function() {
    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fsExtra, 'outputJson').and.callFake(function() {});
        var writeOptions = {
            outputPath : outputGltfPath,
            embed : true,
            embedImage : true,
            createDirectory : false
        };

        expect(readGltf(gltfPath)
            .then(function(gltf) {
                return writeGltf(gltf, writeOptions);
            })
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
            })
            .catch(function(err) {
                throw err;
            }), done).toResolve();
    });

    it('throws an invalid output path error', function(done) {
        var writeOptions = {
            outputPath : undefined,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        expect(readGltf(gltfPath)
            .then(function(gltf) {
                expect(function() {
                    writeGltf(gltf, writeOptions);
                }).toThrowError('Output path is undefined.');
            }), done).toResolve();
    });

    it('throws an invalid output extension error', function(done) {
        var writeOptions = {
            outputPath : invalidPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        expect(readGltf(gltfPath)
            .then(function(gltf) {
                expect(function() {
                    writeGltf(gltf, writeOptions);
                }).toThrowError('Invalid output path extension.');
            }), done).toResolve();
    });
});
