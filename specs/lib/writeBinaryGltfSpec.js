'use strict';
var fs = require('fs');
var path = require('path');
var loadGltfUris = require('../../lib/loadGltfUris');
var removeUnused = require('../../lib/removeUnused');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var outputPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';


describe('writeBinaryGltf', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfPath, function(err, data) {
            if (err) {
                throw err;
            }
            gltf = JSON.parse(data);
            removeUnused(gltf);
            gltf = loadGltfUris(gltf, path.dirname(gltfPath), function(err) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });

    it('writes binary gltf', function() {
        // console.log(gltf.images);
        // parseBinaryGltf(testData.binary);
        // writeBinaryGltf(gltf, outputPath, true, true);
    });
});