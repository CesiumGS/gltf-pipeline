'use strict';
var Cesium = require('cesium');
var PrimitiveType = Cesium.PrimitiveType;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = modeToPrimitiveType;

function modeToPrimitiveType(mode) {
    switch(mode) {
        case WebGLConstants.POINTS:
            return PrimitiveType.POINTS;
        case WebGLConstants.LINES:
            return PrimitiveType.LINES;
        case WebGLConstants.LINE_LOOP:
            return PrimitiveType.LINE_LOOP;
        case WebGLConstants.LINE_STRIP:
            return PrimitiveType.LINE_STRIP;
        case WebGLConstants.TRIANGLES:
            return PrimitiveType.TRIANGLES;
        case WebGLConstants.TRIANGLE_STRIP:
            return PrimitiveType.TRIANGLE_STRIP;
        case WebGLConstants.TRIANGLE_FAN:
            return PrimitiveType.TRIANGLE_FAN;
    }
}
