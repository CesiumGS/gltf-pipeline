'use strict';
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
module.exports = parseBinaryGltf;

function parseBinaryGltf(data, callback) {
    var sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;
    var byteOffset = 0;

    if (data.slice(byteOffset, sizeOfUint32).toString() !== 'glTF') {
        throw new Error('File is not valid binary glTF');
    }

    byteOffset += 3*sizeOfUint32;
    var dataView = new DataView(data.buffer);
    var sceneLength = dataView.getUint32(byteOffset, true);

    byteOffset += 2*sizeOfUint32;
    var decoder = new StringDecoder();
    var scene = decoder.write(data.slice(byteOffset, byteOffset + sceneLength));

    var gltf = JSON.parse(scene);
    // console.log(gltf.buffers);

    byteOffset += sceneLength;
    var body = data.slice(byteOffset);
//     console.log(body.toString());

    fs.writeFile('CesiumTexturedBoxTestBinary.txt', 
        JSON.stringify(gltf, undefined, 2), function (err) {
        // JSON.stringify(gltf, undefined, 2), function (err) {
        if (err) {
            throw err;
        }
        if(callback) {
            callback();
        }
    });   

}