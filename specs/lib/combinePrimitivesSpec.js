'use strict';
var addPipelineExtras = require('../../lib/addPipelineExtras');
var combinePrimitives = require('../../lib/combinePrimitives');
var gltfPath = './specs/data/combineObjects/combinePrimitives.gltf';

describe('addPipelineExtras', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfPath, function(err, data) {
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
            done();
        });
    });

    
});