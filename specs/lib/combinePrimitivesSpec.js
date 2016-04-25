'use strict';
var fs = require('fs');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var combinePrimitives = require('../../lib/combinePrimitives');
var writeGltf = require('../../lib/writeGltf');
var gltfPath = './specs/data/combineObjects/doubleBox.gltf';

describe('addPipelineExtras', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfPath, function(err, data) {
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
            done();
        });
    });

    it('combines two primitives referencing the same bufferView', function() {
        combinePrimitives(gltf);
        gltf = writeGltf(gltf, './specs/data/combineObjects/combineOutput.gltf', true, true);
    });
});