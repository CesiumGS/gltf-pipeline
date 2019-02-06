'use strict';

const { RuntimeError } = require('cesium');

const dataUriToBuffer = require('../../lib/dataUriToBuffer');
const getImageExtension = require('../../lib/getImageExtension');

const pngData = dataUriToBuffer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQcDxwOcoRpqQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAFElEQVQI12P8//8/AwwwMSAB3BwAlm4DBdoYksUAAAAASUVORK5CYII=');
const gifData = dataUriToBuffer('data:image/gif;base64,R0lGODdhBAAEAIAAAP///////ywAAAAABAAEAAACBISPCQUAOw==');
const jpgData = dataUriToBuffer('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=');
const bmpData = dataUriToBuffer('data:image/bmp;base64,Qk1mAAAAAAAAADYAAAAoAAAABAAAAAQAAAABABgAAAAAADAAAAATCwAAEwsAAAAAAAAAAAAA////////////////////////////////////////////////////////////////');
const ktxData = dataUriToBuffer('data:image/ktx:base64,q0tUWCAxMbsNChoKAQIDBAEUAAABAAAACBkAAFiAAAAIGQAABAAAAAQAAAAAAAAAAAAAAAEAAAABAAAAIAAAABsAAABLVFhPcmllbnRhdGlvbgBTPXIsVD1kLFI9aQAAQAAAAP////////////////////////////////////////////////////////////////////////////////////8=');
const crnData = dataUriToBuffer('data:image/crn:base64,SHgAUktGAAAAlds6AAQABAMBAAAAAAAAAAAAAAAAAAAAAABSAAAXAAEAAGkAAAwAAQAAAAAAAAAAAAAAAAAAAAAAHQAAdQAAAJIAAACTAAAAlACCYIAAAAAAABkwBAmCAAAAAAAAbRYAAGZggAAAAAAAGNAAAAZgAAAAAAAAEAAzAAAAAAAAAIABmAAAAAAAAAQAAAA=');
const textData = dataUriToBuffer('data:text/plain;charset=utf-8,randomtext');

describe('getImageExtension', () => {
    it('gets image extension from buffer', () => {
        expect(getImageExtension(pngData)).toBe('.png');
        expect(getImageExtension(gifData)).toBe('.gif');
        expect(getImageExtension(jpgData)).toBe('.jpg');
        expect(getImageExtension(bmpData)).toBe('.bmp');
        expect(getImageExtension(ktxData)).toBe('.ktx');
        expect(getImageExtension(crnData)).toBe('.crn');
    });

    it('throws error if buffer does not contain image data', () => {
        let thrownError;
        try {
            getImageExtension(textData);
        } catch (e) {
            thrownError = e;
        }
        expect(thrownError).toEqual(new RuntimeError('Image data does not have valid header'));
    });
});
