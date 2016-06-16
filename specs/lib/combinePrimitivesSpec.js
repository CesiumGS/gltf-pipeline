'use strict';
var fs = require('fs');
var readGltf = require('../../lib/readGltf');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var combinePrimitives = require('../../lib/combinePrimitives');
var writeGltf = require('../../lib/writeGltf');
var loadGltfUris = require('../../lib/loadGltfUris');
var removePipelineExtras = require('../../lib/removePipelineExtras');

var boxPath = './specs/data/combineObjects/box.gltf';
var doubleBoxToCombinePath = './specs/data/combineObjects/doubleBoxToCombine.gltf';
var doubleBoxNotCombinedPath = './specs/data/combineObjects/doubleBoxNotCombined.gltf';
var fiveBoxPath = './specs/data/combineObjects/fiveBox.gltf';

describe('combinePrimitives', function() {
    it('does not affect single primitives', function(done){
        readGltf(boxPath, function(gltf) {
            var box = gltf;
            var stringBox = JSON.stringify(box);
            combinePrimitives(box);
            expect(stringBox).toEqual(JSON.stringify(box));
            done();
        });
    });

    it('does not combine two primitives', function(done) {
        readGltf(doubleBoxNotCombinedPath, function(gltf){
            var doubleBoxNotCombined = gltf;
            var stringDoubleBoxNotCombined = JSON.stringify(doubleBoxNotCombined);
            combinePrimitives(doubleBoxNotCombined);
            expect(stringDoubleBoxNotCombined).toEqual(JSON.stringify(doubleBoxNotCombined));
            done();
        });
    });

    it('combines two primitives', function(done) {
        readGltf(doubleBoxToCombinePath, function(gltf){
            var doubleBoxToCombine = gltf;

            combinePrimitives(doubleBoxToCombine);
            removePipelineExtras(doubleBoxToCombine);
            
            expect(doubleBoxToCombine.meshes.meshTest.primitives.length).toEqual(1);
            expect(doubleBoxToCombine.meshes.meshTest.primitives[0].material).toEqual('Effect_outer');
            expect(doubleBoxToCombine.meshes.meshTest.primitives[0].mode).toEqual(4);
            expect(doubleBoxToCombine.meshes.meshTest.primitives[0].indices).toEqual('meshTest_INDEX_accessor_0');

            expect(doubleBoxToCombine.meshes.meshTest.primitives[0].attributes).toEqual({
                "NORMAL": 'meshTest_NORMAL_accessor_0',
                "POSITION": 'meshTest_POSITION_accessor_0',
                "TEXCOORD_0": 'meshTest_TEXCOORD_0_accessor_0'
            });

            expect(doubleBoxToCombine.accessors['meshTest_INDEX_accessor_0']).toEqual({
                "bufferView": "meshTest_INDEX_bufferView_0",
                "byteOffset": 0,
                "byteStride": 0,
                "componentType": 5123,
                "type": "SCALAR",
                "count": 516,
                "max": [319],
                "min": [0]
            });

            expect(doubleBoxToCombine.accessors['meshTest_POSITION_accessor_0']).toEqual({
                "bufferView": "meshTest_POSITION_bufferView_0",
                "byteOffset": 0,
                "byteStride": 12,
                "componentType": 5126,
                "type": "VEC3",
                "count": 320,
                "max": [0.5, 0.5, 0.5],
                "min": [-0.5, -0.5, -0.5]
            });
            expect(doubleBoxToCombine.bufferViews['meshTest_INDEX_bufferView_0'].buffer).toEqual('meshTest_INDEX_buffer_0');
            done();
        });
    });

    it('combines some primitives', function(done){
        readGltf(fiveBoxPath, function(gltf){
            var fiveBox = gltf;
            combinePrimitives(fiveBox);
            expect(fiveBox.meshes.meshTest.primitives.length).toEqual(3);

            expect(Object.keys(fiveBox.accessors).indexOf('meshTest_INDEX_accessor_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.accessors).indexOf('meshTest_POSITION_accessor_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.accessors).indexOf('meshTest_INDEX_accessor_1')).not.toEqual(-1);
            expect(Object.keys(fiveBox.accessors).indexOf('meshTest_POSITION_accessor_1')).not.toEqual(-1);
            expect(Object.keys(fiveBox.bufferViews).indexOf('meshTest_INDEX_bufferView_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.bufferViews).indexOf('meshTest_POSITION_bufferView_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.bufferViews).indexOf('meshTest_INDEX_bufferView_1')).not.toEqual(-1);
            expect(Object.keys(fiveBox.bufferViews).indexOf('meshTest_POSITION_bufferView_1')).not.toEqual(-1);
            expect(Object.keys(fiveBox.buffers).indexOf('meshTest_INDEX_buffer_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.buffers).indexOf('meshTest_POSITION_buffer_0')).not.toEqual(-1);
            expect(Object.keys(fiveBox.buffers).indexOf('meshTest_INDEX_buffer_1')).not.toEqual(-1);
            expect(Object.keys(fiveBox.buffers).indexOf('meshTest_POSITION_buffer_1')).not.toEqual(-1);

            expect(fiveBox.accessors['meshTest_INDEX_accessor_1'].bufferView).toEqual('meshTest_INDEX_bufferView_1');
            expect(fiveBox.bufferViews['meshTest_INDEX_bufferView_1'].buffer).toEqual('meshTest_INDEX_buffer_1');
            done();
        });
    });

    it('throws a type error', function(done) {
        readGltf(doubleBoxToCombinePath, function (gltf) {
            var typeError = gltf;
            typeError.accessors.accessor_29.type = 'VEC3';
            expect(function () {
                combinePrimitives(typeError);
            }).toThrow();
            done();
        });
    });

    it ('throws a componentType error', function(done) {
        readGltf(doubleBoxToCombinePath, function(gltf){
            var componentTypeError = gltf;
            componentTypeError.accessors.accessor_29.componentType = 5126;
            expect(function () {
                combinePrimitives(componentTypeError);
            }).toThrow();
            done();
        });
    });
});
