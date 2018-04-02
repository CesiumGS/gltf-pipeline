'use strict';
var addToArray = require('../../lib/addToArray');

describe('addToArray', function() {
    it('adds item to array and returns its index', function() {
        var gltf = {
            buffers : []
        };
        var buffer0 = {
            byteLength : 100
        };
        var buffer1 = {
            byteLength : 200
        };
        expect(addToArray(gltf.buffers, buffer0)).toBe(0);
        expect(addToArray(gltf.buffers, buffer1)).toBe(1);
        expect(gltf.buffers).toEqual([buffer0, buffer1]);
    });
});
