'use strict';

var fs = require('fs');
var quantizeAttributes = require('../../lib/quantizeAttributes');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var writeGltf = require('../../lib/writeGltf')
var boxPath = './specs/data/quantized/';
var outputPath = './output/Duck-Quantized.gltf';

describe('quantizeAttributes', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(boxPath + 'Duck.gltf', function(err, data) {
            if(!err) {
                gltf = JSON.parse(data);
                addPipelineExtras(gltf);
                loadGltfUris(gltf, boxPath, function() {
                    done();
                });
            }
        });
    });

    it('quantizes positions', function() {
        quantizeAttributes(gltf, {
            "attributes": {
                "LOD3spShape-lib": {
                    "0": [
                        "POSITION"
                    ]
                }
            }
        });
        writeGltf(gltf, outputPath, true);
    });
});