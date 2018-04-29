'use strict';
var Cesium = require('cesium');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var processGltf = require('./processGltf');

var defaultValue = Cesium.defaultValue;

module.exports = gltfToGlb;

/**
 * Convert a glTF to glb.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] The same options object as {@link processGltf}
 * @returns {Promise} A promise that resolves to a buffer containing the glb contents.
 */
function gltfToGlb(gltf, options) {
    options = defaultValue(options, {});
    options.bufferStorage = {
        buffer: undefined
    };

    return processGltf(gltf, options)
        .then(function(results) {
            return {
                glb: getGlb(results.gltf, options.bufferStorage.buffer),
                separateResources: results.separateResources
            };
        });
}

function getGlb(gltf, binaryBuffer) {
    var jsonBuffer = getJsonBufferPadded(gltf);

    // Allocate buffer (Global header) + (JSON chunk header) + (JSON chunk) + (Binary chunk header) + (Binary chunk)
    var glbLength = 12 + 8 + jsonBuffer.length + 8 + binaryBuffer.length;
    var glb = Buffer.alloc(glbLength);

    // Write binary glTF header (magic, version, length)
    var byteOffset = 0;
    glb.writeUInt32LE(0x46546C67, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(2, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(glbLength, byteOffset);
    byteOffset += 4;

    // Write JSON Chunk header (length, type)
    glb.writeUInt32LE(jsonBuffer.length, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(0x4E4F534A, byteOffset); // JSON
    byteOffset += 4;

    // Write JSON Chunk
    jsonBuffer.copy(glb, byteOffset);
    byteOffset += jsonBuffer.length;

    // Write Binary Chunk header (length, type)
    glb.writeUInt32LE(binaryBuffer.length, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(0x004E4942, byteOffset); // BIN
    byteOffset += 4;

    // Write Binary Chunk
    binaryBuffer.copy(glb, byteOffset);
    return glb;
}
