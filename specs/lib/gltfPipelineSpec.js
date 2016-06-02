'use strict';
var gltfPipeline = require('../../lib/gltfPipeline');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var Cesium = require('cesium');
var defined = Cesium.defined;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf file, checks that gltf is defined when passing in a gltf file', function(done) {
        gltfPipeline({
            inputPath : gltfPath,
            separate : false
        }, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(gltfPath);
            done();
        });
    });

    it('optimizes a binary glTF file, checks that gltf is defined when passing in a glb file', function(done) {
        gltfPipeline({
            inputPath : glbPath,
            separate : false
        }, function(gltf) {
            expect(gltf).toBeDefined();
            expect(gltf).not.toBe(glbPath);
            done();
        });
    });

    it('throws developer error if input path is undefined', function(done) {
        var options = {
            inputPath : undefined,
            separate : false
        };
        expect(function() {
            try {
                gltfPipeline(options, function() {
                    done();
                });
            }
            catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('Input path is undefined.');
                throw err;
            }
        }).toThrow();
        done()
    });
    
    it('throws error if file extension of input file is invalid', function(done) {
        var options = {
            inputPath : './specs/data/boxTexturedUnoptimized/README.md',
            separate : false
        };
        expect(function() {
            try {
                gltfPipeline(options, function() {
                    done();
                });
            }
            catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('Invalid glTF file.');
                throw err;
            }
        }).toThrow();
        done()
    });
});
