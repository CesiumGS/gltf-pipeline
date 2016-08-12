'use strict';
var combinePrimitives = require('../../lib/combinePrimitives');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');

var doubleBoxToCombinePath = './specs/data/combineObjects/doubleBoxToCombine.gltf';

describe('combinePrimitives', function() {
    var options = {};

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
});
