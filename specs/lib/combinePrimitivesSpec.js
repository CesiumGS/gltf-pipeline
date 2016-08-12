'use strict';
var combinePrimitives = require('../../lib/combinePrimitives');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');

var boxPath = './specs/data/combineObjects/box.gltf';
var doubleBoxToCombinePath = './specs/data/combineObjects/doubleBoxToCombine.gltf';
var doubleBoxNotCombinedPath = './specs/data/combineObjects/doubleBoxNotCombined.gltf';
var fiveBoxPath = './specs/data/combineObjects/fiveBox.gltf';

describe('combinePrimitives', function() {
    var options = {};

    it('does not affect single primitives', function(done){
        expect(readGltf(boxPath, options)
            .then(function(gltf) {
                var box = gltf;
                var stringBox = JSON.stringify(box);
                combinePrimitives(box);
                expect(stringBox).toEqual(JSON.stringify(box));
        }), done).toResolve();
    });

    it('does not combine two primitives', function(done) {
        expect(readGltf(doubleBoxNotCombinedPath, options)
            .then(function(gltf) {
                var doubleBoxNotCombined = gltf;
                var stringDoubleBoxNotCombined = JSON.stringify(doubleBoxNotCombined);
                combinePrimitives(doubleBoxNotCombined);
                expect(stringDoubleBoxNotCombined).toEqual(JSON.stringify(doubleBoxNotCombined));
            }), done).toResolve();
    });

    it('combines two primitives', function(done) {
        expect(readGltf(doubleBoxToCombinePath, options)
            .then(function(gltf) {
                var accessors = gltf.accessors;
                var doubleBoxToCombine = gltf;
                combinePrimitives(doubleBoxToCombine);

                var primitives = doubleBoxToCombine.meshes.meshTest.primitives;
                expect(primitives.length).toEqual(1);
                var primitive = primitives[0];
                expect(primitive.material).toEqual('Effect_outer');
                expect(primitive.mode).toEqual(4);

                var indexAccessor = accessors[primitive.indices];
                expect(indexAccessor.max).toEqual([319]);
                expect(indexAccessor.min).toEqual([0]);

                var positionAccessor = accessors[primitive.attributes.POSITION];
                expect(positionAccessor.max).toEqual([0.5, 0.5, 0.5]);
                expect(positionAccessor.min).toEqual([-0.5, -0.5, -0.5]);

                var normalAccessor = accessors[primitive.attributes.NORMAL];
                expect(normalAccessor.max).toEqual([1.0, 1.0, 1.0]);
                expect(normalAccessor.min).toEqual([-1.0, -1.0, -1.0]);
            }), done).toResolve();
    });

    it('combines some primitives', function(done){
        expect(readGltf(fiveBoxPath, options)
            .then(function(gltf){
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

                expect(fiveBox.accessors.meshTest_INDEX_accessor_1.bufferView).toEqual('meshTest_INDEX_bufferView_1');
                expect(fiveBox.bufferViews.meshTest_INDEX_bufferView_1.buffer).toEqual('meshTest_INDEX_buffer_1');
            }), done).toResolve();
    });
});
