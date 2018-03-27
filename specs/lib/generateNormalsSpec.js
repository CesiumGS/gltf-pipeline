'use strict';
var clone = require('clone');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var readGltf = require('../../lib/readGltf');
var generateNormals = require('../../lib/generateNormals');

var gltfNoNormalsPath = './specs/data/generateNormals/box_no_normals.gltf';
var gltfNormalsPath = './specs/data/generateNormals/box_normals.gltf';
var boxahedronNoNormalsGltfPath = './specs/data/generateNormals/boxahedron_no_normals.gltf';
var boxTexturedTransparentGltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestTransparentNoNormals.gltf';

describe('generateNormals', function(){
    var gltfNoNormals;
    var gltfNormals;

    beforeEach(function(done) {
        readGltf(gltfNoNormalsPath)
            .then(function(gltf) {
                gltfNoNormals = gltf;
                addPipelineExtras(gltfNoNormals);
                return readGltf(gltfNormalsPath);
            })
            .then(function(gltf) {
                gltfNormals = gltf;
                addPipelineExtras(gltfNormals);
                done();
            });
    });

    it('generates smooth normals if they do not exist', function() {
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

    it('generates face normals if they do not exist', function() {
        var gltf = gltfNoNormals;
        var byteLengthBefore = 168;
        generateNormals(gltf, {
            faceNormals : true
        });

        var attributes = gltf.meshes.mesh_box.primitives[0].attributes;
        var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
        expect(attributes.NORMAL).toBeDefined();
        expect(gltf.accessors[attributes.NORMAL]).toBeDefined();
        expect(byteLengthAfter).toBe(byteLengthBefore + 8 * 3 * 4); // 8 normals are generated
    });

    it('generating smooth normals for mesh with more than 1 primitive produces unique normals accessors', function() {
        readGltf(boxahedronNoNormalsGltfPath)
            .then(function(gltf) {
                gltfNoNormals = gltf;
                addPipelineExtras(gltfNoNormals);
            })
            .then(function() {
                var gltf = gltfNoNormals;
                var byteLengthBefore = 432;
                generateNormals(gltf);

                var attributes0 = gltf.meshes['Geometry-mesh002'].primitives[0].attributes;
                var attributes1 = gltf.meshes['Geometry-mesh002'].primitives[1].attributes;
                var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
                expect(attributes0.NORMAL).toBeDefined();
                expect(attributes1.NORMAL).toBeDefined();
                expect(gltf.accessors[attributes0.NORMAL]).toBeDefined();
                expect(gltf.accessors[attributes1.NORMAL]).toBeDefined();
                expect(gltf.accessors[attributes0.NORMAL]).not.toEqual(gltf.accessors[attributes1.NORMAL]);
                expect(byteLengthAfter).toBe(byteLengthBefore + 28 * 3 * 4); // 28 normals are generated
            });
    });

    it('generates normals checks for image transparency', function() {
        return readGltf(boxTexturedTransparentGltfPath)
            .then(function(gltf) {
                gltfNoNormals = gltf;
                addPipelineExtras(gltfNoNormals);
            })
            .then(function() {
                var gltf = gltfNoNormals;
                var byteLengthBefore = 792;
                generateNormals(gltf);

                var attributes0 = gltf.meshes['mesh0'].primitives[0].attributes;
                var byteLengthAfter = gltf.buffers[Object.keys(gltf.buffers)[0]].byteLength;
                expect(attributes0.NORMAL).toBeDefined();
                expect(gltf.accessors[attributes0.NORMAL]).toBeDefined();
                expect(byteLengthAfter).toBe(byteLengthBefore + 36 * 3 * 4); // 36 normals are generated

                var expectedStates = {
                    enable: [ 2929, 3042 ],
                    functions: {
                        depthMask: [ false ],
                        blendEquationSeparate: [ 32774, 32774 ],
                        blendFuncSeparate: [ 1, 771, 1, 771 ]
                    }
                };

                expect(gltf.techniques.technique1.states).toEqual(expectedStates);
            });
    });
});
