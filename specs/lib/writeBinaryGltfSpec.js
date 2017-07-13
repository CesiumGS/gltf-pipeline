'use strict';
var fsExtra = require('fs-extra');
var path = require('path');

var readGltf = require('../../lib/readGltf');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');

var outputGltfPath = './output/CesiumTexturedBoxTest.glb';
var invalidPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.exe';

describe('writeBinaryGltf', function() {
    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fsExtra, 'outputFile').and.callFake(function() {});
        var writeOptions = {
            outputPath : outputGltfPath,
            embed : true,
            embedImage : true,
            createDirectory : false
        };

        var gltf = {};
        expect(writeBinaryGltf(gltf, writeOptions)
            .then(function(gltf) {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
            })
            .catch(function (err) {
                throw err;
            }), done).toResolve();
    });

    it('throws an invalid output path error', function() {
        var writeOptions = {
            outputPath : undefined,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        var gltf = {};
        expect(function() {
            writeBinaryGltf(gltf, writeOptions);
        }).toThrowError('Output path is undefined.');
    });

    it('throws an invalid output extension error', function() {
        var writeOptions = {
            outputPath : invalidPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        var gltf = {};
        expect(function() {
            writeBinaryGltf(gltf, writeOptions);
        }).toThrowError('Invalid output path extension.');
    });
});
