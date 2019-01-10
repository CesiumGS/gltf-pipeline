'use strict';
const dataUriToBuffer = require('../../lib/dataUriToBuffer');
const getImageExtension = require('../../lib/getImageExtension');

const pngData = dataUriToBuffer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQcDxwOcoRpqQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAFElEQVQI12P8//8/AwwwMSAB3BwAlm4DBdoYksUAAAAASUVORK5CYII=');
const gifData = dataUriToBuffer('data:image/gif;base64,R0lGODdhBAAEAIAAAP///////ywAAAAABAAEAAACBISPCQUAOw==');
const jpgData = dataUriToBuffer('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=');
const bmpData = dataUriToBuffer('data:image/bmp;base64,Qk1mAAAAAAAAADYAAAAoAAAABAAAAAQAAAABABgAAAAAADAAAAATCwAAEwsAAAAAAAAAAAAA////////////////////////////////////////////////////////////////');
const ktxData = dataUriToBuffer('data:image/ktx:base64,q0tUWCAxMbsNChoKAQIDBAEUAAABAAAACBkAAFiAAAAIGQAABAAAAAQAAAAAAAAAAAAAAAEAAAABAAAAIAAAABsAAABLVFhPcmllbnRhdGlvbgBTPXIsVD1kLFI9aQAAQAAAAP////////////////////////////////////////////////////////////////////////////////////8=');
const crnData = dataUriToBuffer('data:image/crn:base64,SHgAUktGAAAAlds6AAQABAMBAAAAAAAAAAAAAAAAAAAAAABSAAAXAAEAAGkAAAwAAQAAAAAAAAAAAAAAAAAAAAAAHQAAdQAAAJIAAACTAAAAlACCYIAAAAAAABkwBAmCAAAAAAAAbRYAAGZggAAAAAAAGNAAAAZgAAAAAAAAEAAzAAAAAAAAAIABmAAAAAAAAAQAAAA=');
const webpData = dataUriToBuffer('data:image/webp;base64,UklGRkgAAABXRUJQVlA4WAoAAAAQAAAACQAACQAAQUxQSAoAAAABB1CyiAhERP8DVlA4IBgAAAAwAQCdASoKAAoAAUAmJaQAA3AA/u4DAAA=');
const textData = dataUriToBuffer('data:text/plain;charset=utf-8,randomtext');

describe('getImageExtension', function() {
    it('gets image extension from buffer', function() {
        expect(getImageExtension(pngData)).toBe('.png');
        expect(getImageExtension(gifData)).toBe('.gif');
        expect(getImageExtension(jpgData)).toBe('.jpg');
        expect(getImageExtension(bmpData)).toBe('.bmp');
        expect(getImageExtension(ktxData)).toBe('.ktx');
        expect(getImageExtension(crnData)).toBe('.crn');
        expect(getImageExtension(webpData)).toBe('.webp');
    });

    it('throws error if buffer does not contain image data', function() {
        expect(function() {
            getImageExtension(textData);
        }).toThrowRuntimeError();
    });
});
