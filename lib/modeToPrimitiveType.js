'use strict';
var Cesium = require('cesium');
var PrimitiveType = Cesium.PrimitiveType;

module.exports = modeToPrimitiveType;

function modeToPrimitiveType(mode) {
    switch(mode) {
        case 0:
            return PrimitiveType.POINTS;
        case 1:
            return PrimitiveType.LINES;
        case 2:
            return PrimitiveType.LINE_LOOP;
        case 3:
            return PrimitiveType.LINE_STRIP;
        case 4:
            return PrimitiveType.TRIANGLES;
        case 5:
            return PrimitiveType.TRIANGLE_STRIP;
        case 6:
            return PrimitiveType.TRIANGLE_FAN;
    }
}
