'use strict';
var getJsonBufferPadded = require('../../lib/getJsonBufferPadded');

describe('getJsonBufferPadded', function() {
    it('get json buffer padded to 4 bytes', function() {
        var gltf = {
            asset: {
                version: '2.0'
            }
        };
        var string = JSON.stringify(gltf);
        expect(string.length).toBe(27);
        var bufferPadded = getJsonBufferPadded(gltf);
        expect(bufferPadded.length).toBe(28);
        expect(bufferPadded.readUInt8(27)).toBe(32); // Space
    });
});
