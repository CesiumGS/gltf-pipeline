'use strict';
var clone = require('clone');
var fs = require('fs');
var readGltf = require('../../lib/readGltf');
var generateTangentsBitangents = require('../../lib/generateTangentsBitangents');

var gltfNoTangentsBitangentsPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfTangentsBitangentsPath   = './specs/data/generateTangentsBitangents/CesiumTexturedBoxTest_TangentsBitangents.gltf';

describe('generateTangentsBitangents', function(){
    var gltfNoTangentsBitangents;
    var gltfTangentsBitangents;

    beforeAll(function(done) {
        readGltf(gltfNoTangentsBitangentsPath)
            .then(function(gltf) {
                gltfNoTangentsBitangents = gltf;
                return readGltf(gltfTangentsBitangentsPath);
            })
            .then(function(gltf) {
                gltfTangentsBitangents = gltf;
                done();
            });
    });

    it('generates tangents and bitangents if they do not exist', function() {
        var gltf = gltfNoTangentsBitangents;
        var byteLengthBefore = 840;

        generateTangentsBitangents(gltf);

        var attributes = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0].attributes;
        var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
        expect(attributes.TANGENT).toBeDefined();
        expect(attributes.BITANGENT).toBeDefined();
        expect(gltf.accessors[attributes.TANGENT]).toBeDefined();
        expect(gltf.accessors[attributes.BITANGENT]).toBeDefined();
        expect(byteLengthAfter).toBe(byteLengthBefore + 2 * 24 * 3 * 4); // 24 tangents and 24 bitangents are generated
    });

    it('does not generate tangents and bitangents if they already exist', function() {
        var gltf = gltfTangentsBitangents;
        var gltfCopy = clone(gltf);
        generateTangentsBitangents(gltf);
        expect(gltf.meshes).toEqual(gltfCopy.meshes);
    });

});
