'use strict';
var dataUriToBuffer = require('../../lib/dataUriToBuffer');

describe('dataUriToBuffer', function() {
    it('converts base64 data uri to buffer', function() {
        var buffer = Buffer.from([103, 108, 84, 70]);
        var dataUri = 'data:application/octet-stream;base64,' + buffer.toString('base64');
        expect(dataUriToBuffer(dataUri)).toEqual(buffer);
    });

    it('converts utf8 data uri to buffer', function() {
        var buffer = Buffer.from([103, 108, 84, 70]);
        var dataUri = 'data:text/plain;charset=utf-8,' + buffer.toString('utf8');
        expect(dataUriToBuffer(dataUri)).toEqual(buffer);
    });
});
