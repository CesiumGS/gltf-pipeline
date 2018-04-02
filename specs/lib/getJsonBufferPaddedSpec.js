'use strict';
var getJsonBufferPadded = require('../../lib/getJsonBufferPadded');

describe('getJsonBufferPadded', function() {
    it('get json buffer padded to 4 bytes', function() {
        var gltf = {
            asset : {
                version : '2.0'
            }
        };
        var string = JSON.stringify(gltf);
        console.log(string.length);
        // TODO : remove above

        var bufferPadded = getJsonBufferPadded(gltf);
        expect(bufferPadded.length).toBe(100);
        // TODO : read char function?
        expect(bufferPadded.readUInt8(99)).toBe(32); // Space
    });
});
