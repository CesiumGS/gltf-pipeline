'use strict';
var clone = require('clone');
var fs = require('fs');
var readGltf = require('../../lib/readGltf');
var generateNormals = require('../../lib/generateNormals');

var gltfNoNormalsPath = './specs/data/generateNormals/box_no_normals.gltf';
var gltfNormalsPath = './specs/data/generateNormals/box_normals.gltf';

describe('generateNormals', function(){
    var gltfNoNormals;
    var gltfNormals;

    beforeAll(function(done) {
        readGltf(gltfNoNormalsPath)
            .then(function(gltf) {
                gltfNoNormals = gltf;
                return readGltf(gltfNormalsPath);
            })
            .then(function(gltf) {
                gltfNormals = gltf;
                done();
            });
    });

    it('generates normals if they do not exist', function() {
        var gltf = gltfNoNormals;
        var byteLengthBefore = 168;
        generateNormals(gltf);

        var attributes = gltf.meshes.mesh_box.primitives[0].attributes;
        var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
        expect(attributes.NORMAL).toBeDefined();
        expect(gltf.accessors[attributes.NORMAL]).toBeDefined();
        expect(byteLengthAfter).toBe(byteLengthBefore + 8 * 3 * 4); // 8 normals are generated
    });

    it('does not generate normals if they already exist', function() {
        var gltf = gltfNormals;
        var gltfCopy = clone(gltf);
        generateNormals(gltf);
        expect(gltf.meshes).toEqual(gltfCopy.meshes);
    });

    it('generates hard normals if they do not exist', function() {
        var gltf = gltfNoNormals;
        var byteLengthBefore = 168;
        generateNormals(gltf, {
            hardNormals : true
        });

        var attributes = gltf.meshes.mesh_box.primitives[0].attributes;
        var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
        expect(attributes.NORMAL).toBeDefined();
        expect(gltf.accessors[attributes.NORMAL]).toBeDefined();
        expect(byteLengthAfter).toBe(byteLengthBefore + 8 * 3 * 4); // 8 normals are generated
    });


});
