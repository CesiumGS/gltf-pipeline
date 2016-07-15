'use strict';
var readGltf = require('../../lib/readGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var invalidPath = './specs/data/boxTexturedUnoptimized/README.md';

describe('readGltf', function() {
    var options = {};

    it('parses a .gltf input path, checks that a gltf JSON is defined', function(done) {
        expect(readGltf(gltfPath, options)
            .then(function(gltf) {
                expect(gltf).toBeDefined();
            }), done).toResolve();
    });

    it('parses a .glb input path, checks that a gltf JSON is defined', function(done) {
        expect(readGltf(glbPath, options)
            .then(function(gltf) {
                expect(gltf).toBeDefined();
            }), done).toResolve();
    });

    it('throws error when an input path is undefined', function() {
        expect(function() {
            readGltf(undefined, options);
        }).toThrowDeveloperError();
    });

    it('throws error when file extension of input file is invalid', function() {
        expect(function() {
            readGltf(invalidPath, options);
        }).toThrowDeveloperError();
    });
});
