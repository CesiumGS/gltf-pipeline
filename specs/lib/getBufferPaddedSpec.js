'use strict';
var getBufferPadded = require('../../lib/getBufferPadded');

describe('getBufferPadded', function() {
    it('gets buffer padded to 4 bytes', function() {
        var buffer = Buffer.alloc(0);
        var bufferPadded = getBufferPadded(buffer);
        expect(bufferPadded.length).toBe(0);

        buffer = Buffer.from([1]);
        bufferPadded = getBufferPadded(buffer);
        expect(bufferPadded.length).toBe(4);
        expect(bufferPadded.readUInt8(0)).toBe(1);
        expect(bufferPadded.readUInt8(1)).toBe(0);
        expect(bufferPadded.readUInt8(2)).toBe(0);
        expect(bufferPadded.readUInt8(3)).toBe(0);

        // Does not allocate a new buffer when buffer length is already aligned to 4 bytes
        buffer = Buffer.alloc(4);
        bufferPadded = getBufferPadded(buffer);
        expect(bufferPadded).toBe(buffer);

        buffer = Buffer.alloc(70);
        bufferPadded = getBufferPadded(buffer);
        expect(bufferPadded.length).toBe(72);
    });
});
