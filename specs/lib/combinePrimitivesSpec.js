'use strict';
var fs = require('fs');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var combinePrimitives = require('../../lib/combinePrimitives');
var gltfPath = './specs/data/combineObjects/combinePrimitives.gltf';

describe('addPipelineExtras', function() {
    var gltf;

    beforeAll(function(done) {
        fs.readFile(gltfPath, function(err, data) {
            gltf = JSON.parse(data);
            addPipelineExtras(gltf);
            // console.log(JSON.stringify(gltf.meshes["Geometry-mesh019"], undefined, 2));
            done();
        });
    });

    it('combines two primitives referencing the same bufferView', function() {
        combinePrimitives(gltf);
        // console.log(JSON.stringify(gltf.meshes["Geometry-mesh019"], undefined, 2));
        
        fs.writeFile('combineTest.gltf', JSON.stringify(gltf, undefined, 2));
    });
});