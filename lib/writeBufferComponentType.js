'use strict';
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;

module.exports = writeBufferComponentType;

function writeBufferComponentType(buffer, componentType, value, byteOffset) {
    switch (componentType) {
        case WebGLConstants.BYTE:
            return buffer.writeInt8(value, byteOffset);
        case WebGLConstants.UNSIGNED_BYTE:
            return buffer.writeUInt8(value, byteOffset);
        case WebGLConstants.SHORT:
            return buffer.writeInt16LE(value, byteOffset);
        case WebGLConstants.UNSIGNED_SHORT:
            return buffer.writeUInt16LE(value, byteOffset);
        case WebGLConstants.FLOAT:
            return buffer.writeFloatLE(value, byteOffset);
    }
}
