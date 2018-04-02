'use strict';
var dataUriToBuffer = require('../../lib/dataUriToBuffer');
var getImageExtension = require('../../lib/getImageExtension');

var pngData = dataUriToBuffer('data:image/png;base64,');
var gifData = dataUriToBuffer('data:image/gif;base64,');
var jpgData = dataUriToBuffer('data:image/jpeg;base64,');
var bmpData = dataUriToBuffer('data:image/bmp;base64,');
var ktxData = dataUriToBuffer('data:image/ktx:base64,');
var crnData = dataUriToBuffer('data:image/crn:base64,');
var textData = dataUriToBuffer('data:text/plain;charset=utf-8,randomtext');

describe('getImageExtension', function() {
    it('gets image extension from buffer', function() {
        expect(getImageExtension(pngData)).toBe('.png');
        expect(getImageExtension(gifData)).toBe('.gif');
        expect(getImageExtension(jpgData)).toBe('.jpg');
        expect(getImageExtension(bmpData)).toBe('.bmp');
        expect(getImageExtension(ktxData)).toBe('.ktx');
        expect(getImageExtension(crnData)).toBe('.crn');
    });

    it('throws error if buffer does not contain image data', function() {
        expect(function() {
            getImageExtension(textData);
        }).toThrowRuntimeError();
    });
});
