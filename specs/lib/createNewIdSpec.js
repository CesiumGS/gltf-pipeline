'use strict';

var createNewId = require('../../lib/createNewId');

describe('createNewId', function() {
    it('creates new ids', function() {
        var gltf = {
            "accessors": {},
            "buffers": {
                "test_POSITION_buffer_0": {
                    "uri": "test.bin"
                }
            }
        };

        var newAccessorId = createNewId(gltf, 'test', 'POSITION', 'accessor');
        var newBufferId = createNewId(gltf, 'test', 'POSITION', 'buffer');
        expect(newAccessorId).toEqual('test_POSITION_accessor_0');
        expect(newBufferId).toEqual('test_POSITION_buffer_1');
    });
});