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

describe('combinePrimitives', function(){
    it('does not affect single primitives', function(){
        readGltf(boxPath, function(gltf) {
            var box = gltf;
            var stringBox = JSON.stringify(box);
            combinePrimitives(box);
            expect(stringBox).toEqual(JSON.stringify(box));
        });
    });

    it('does not combine two primitives', function(){
        readGltf(doubleBoxNotCombinedPath, function(gltf){
            var doubleBoxNotCombined = gltf;
            var stringDoubleBoxNotCombined = JSON.stringify(doubleBoxNotCombined);
            combinePrimitives(doubleBoxNotCombined);
            expect(stringDoubleBoxNotCombined).toEqual(JSON.stringify(doubleBoxNotCombined));


        });

        readGltf(doubleBoxToCombinePath, function(gltf){
            var oneAttribute = gltf;

            oneAttribute.meshes.meshTest.primitives[0].attributes = {
                "POSITION": 'accessor_58'
            };
            combinePrimitives(oneAttribute);
            expect(oneAttribute.meshes.meshTest.primitives.length).toEqual(2);
        });

        readGltf(doubleBoxToCombinePath, function(gltf){
            var differentAttributes = gltf;
            differentAttributes.meshes.meshTest.primitives[0].attributes = {
                "NORMAL": 'accessor_60',
                "POS": 'accessor_58',
                "TEXCOORD_0": 'accessor_62'
            };
            combinePrimitives(differentAttributes);
            expect(differentAttributes.meshes.meshTest.primitives.length).toEqual(2);
        });
    });

    it('combines two primitives', function(){
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
                "count": 516
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
        });
    });

    it('combines some primitives', function(){
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
        });
    });

    it('throws an error', function() {
        readGltf(doubleBoxToCombinePath, function(gltf) {
            var typeError = gltf;
            typeError.accessors.accessor_29.type = 'VEC3';
            expect(function () {
                combinePrimitives(typeError);
            }).toThrow();
        });

        readGltf(doubleBoxToCombinePath, function(gltf){
            var componentTypeError = gltf;
            componentTypeError.accessors.accessor_29.componentType = 5126;
            expect(function () {
                combinePrimitives(componentTypeError);
            }).toThrow();
        });
    });
});
