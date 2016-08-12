'use strict';
var combinePrimitives = require('../../lib/combinePrimitives');
var readGltf = require('../../lib/readGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');

var doubleBoxToCombinePath = './specs/data/combineObjects/doubleBoxToCombine.gltf';

describe('combinePrimitives', function() {
    var arrayOneA = new Float32Array([1, 2, 3]);
    var bufferOneA = new Buffer(arrayOneA.buffer);
    var arrayTwoA = new Float32Array([4, 5, 6]);
    var bufferTwoA = new Buffer(arrayTwoA.buffer);
    var arrayOneB = new Uint16Array([1, 2, 3]);
    var bufferOneB = new Buffer(arrayOneB.buffer);
    var arrayTwoB = new Uint16Array([4, 5, 6]);
    var bufferTwoB = new Buffer(arrayTwoB.buffer);

    it('combines two primitives by concatenating them', function() {

    });

    it('combines two primitives with shared attribute accessors by merging them', function() {

    });

    it('combines three primitives, merging two and then concatenating the result with the third', function() {

    });

    it('doesn\'t combine primitive that has attribute accessors that are different sizes', function() {

    });

    it('doesn\'t combine primitives that share a single attribute accessor', function() {

    });

    it('doesn\'t combine primitives that )
});
