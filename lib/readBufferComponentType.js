'use strict';
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;

module.exports = readBufferComponentType;

function readBufferComponentType(buffer, componentType, byteOffset) {
    switch (componentType) {
        case WebGLConstants.BYTE:
            return buffer.readInt8(byteOffset);
        case WebGLConstants.UNSIGNED_BYTE:
            return buffer.readUInt8(byteOffset);
        case WebGLConstants.SHORT:
            return buffer.readInt16LE(byteOffset);
        case WebGLConstants.UNSIGNED_SHORT:
            return buffer.readUInt16LE(byteOffset);
        case WebGLConstants.FLOAT:
            return buffer.readFloatLE(byteOffset);
    }
}
