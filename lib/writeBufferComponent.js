'use strict';
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;

module.exports = writeBufferComponent;

/**
 * Writes a value to a buffer as a particular component type.
 *
 * @param {Buffer} buffer The buffer to be written.
 * @param {Number} componentType WebGLConstants value for component type.
 * @param {Number} value The value to write.
 * @param {Number} byteOffset The offset into the buffer to be written.
 */
function writeBufferComponent(buffer, componentType, value, byteOffset) {
    switch (componentType) {
        case WebGLConstants.BYTE:
            return buffer.writeInt8(value, byteOffset);
        case WebGLConstants.UNSIGNED_BYTE:
            return buffer.writeUInt8(value, byteOffset);
        case WebGLConstants.SHORT:
            return buffer.writeInt16LE(value, byteOffset);
        case WebGLConstants.UNSIGNED_SHORT:
            return buffer.writeUInt16LE(value, byteOffset);
        case WebGLConstants.UNSIGNED_INT:
            return buffer.writeUInt32LE(value, byteOffset);
        case WebGLConstants.FLOAT:
            return buffer.writeFloatLE(value, byteOffset);
    }
}
