'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

module.exports = readBufferComponent;

/**
 * Read from a buffer at an offset for a particular component type.
 *
 * @param {Buffer} buffer The buffer to read.
 * @param {Number} componentType WebGLConstants componentType to use for reading.
 * @param {Number} byteOffset Read starting from this offset.
 * @returns {Number} The resulting number value.
 */
function readBufferComponent(buffer, componentType, byteOffset) {
    switch (componentType) {
        case WebGLConstants.BYTE:
            return buffer.readInt8(byteOffset);
        case WebGLConstants.UNSIGNED_BYTE:
            return buffer.readUInt8(byteOffset);
        case WebGLConstants.SHORT:
            return buffer.readInt16LE(byteOffset);
        case WebGLConstants.UNSIGNED_SHORT:
            return buffer.readUInt16LE(byteOffset);
        case WebGLConstants.UNSIGNED_INT:
            return buffer.readUInt32LE(byteOffset);
        case WebGLConstants.FLOAT:
            return buffer.readFloatLE(byteOffset);
    }
}
