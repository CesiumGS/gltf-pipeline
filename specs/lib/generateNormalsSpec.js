'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var readGltf = require('../../lib/readGltf');
var generateNormals = require('../../lib/generateNormals');

var gltfNoNormalsPath = './specs/data/generateNormals/box_no_normals.gltf';
var gltfNormalsPath = './specs/data/generateNormals/box_normals.gltf';

describe('generateNormals', function(){
    it('generates normals if they do not exist', function(done) {
        readGltf(gltfNoNormalsPath, function(gltf){
            var attributes = gltf.meshes['mesh_box'].primitives[0].attributes;
            var byteLengthBefore = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
            expect(attributes.NORMAL).toBeUndefined();
            generateNormals(gltf);
            var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
            expect(attributes.NORMAL).toBeDefined();
            expect(gltf.accessors[attributes.NORMAL]).toBeDefined();
            expect(byteLengthAfter).toBe(byteLengthBefore + 8 * 3 * 4); // 8 normals are generated
            done();
        });
    });

    it('does not generate normals if they already exist', function(done) {
        readGltf(gltfNormalsPath, function(gltf){
            var bufferBefore = gltf.buffers[Object.keys(gltf.buffers)[0]].extras._pipeline.source;
            generateNormals(gltf);
            var bufferAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].extras._pipeline.source;
            expect(bufferBefore.equals(bufferAfter)).toBe(true);
            done();
        });
    })
});
