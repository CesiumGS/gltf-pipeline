'use strict';
var fs = require('fs');
var parseBinaryGltf = require('../../lib/parseBinaryGltf');
var binaryGltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';

describe('parseBinaryGltf', function() {
    var binaryGltfData;

    beforeAll(function(done) {
        fs.readFile(binaryGltfPath, function (err, data) {
            if (err) {
                throw err;
            }
            binaryGltfData = data;
            done();
        });
    });

    it('loads a binary gltf file', function(done) {
        // var gltf = {
        //     "images": {
        //         "Image0001": {
        //             "uri": "Cesium_Logo_Flat_Low.png"
        //         }
        //     }
        // };

        // gltf = loadGltfUris(gltf, filePath, function() {
        //     expect(gltf.images.Image0001.extras.source).toBeDefined();
        //     expect(bufferEqual(gltf.images.Image0001.extras.source, imageData)).toBe(true);
        //     expect(gltf.images.Image0001.extras.extension).toEqual('.png');
        //     done();
        // });
        var gltf = parseBinaryGltf(binaryGltfData, function() {
            done();
        });
    });


});