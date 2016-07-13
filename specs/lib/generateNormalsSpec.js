'use strict';
var clone = require('clone');
var fs = require('fs');
var readGltf = require('../../lib/readGltf');
var generateNormals = require('../../lib/generateNormals');

var gltfNoNormalsPath = './specs/data/generateNormals/box_no_normals.gltf';
var gltfNormalsPath = './specs/data/generateNormals/box_normals.gltf';

describe('generateNormals', function(){
    it('generates normals if they do not exist', function(done) {
        var options = {};
        readGltf(gltfNoNormalsPath, options, function(gltf){
            var attributes = gltf.meshes.mesh_box.primitives[0].attributes;
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
        var options = {};
        readGltf(gltfNormalsPath, options, function(gltf){
            var gltfCopy = clone(gltf);
            generateNormals(gltf);
            expect(clone(gltf)).toEqual(gltfCopy);
            done();
        });
    });
});
