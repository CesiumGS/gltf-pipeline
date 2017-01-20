'use strict';
var Cesium = require('cesium');
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = packArray;

/**
 * Packs Cesium types into an array of values.
 *
 * @param {Array} data An array of Cesium types to pack.
 * @param {Number|String} type The WebGL type to use for packing (e.g. WebGLConstants.FLOAT_VEC3 for Cartesian3), or a glTF accessor type (e.g. 'SCALAR', 'VEC3')
 * @returns {Array} An array containing the packed data.
 */
function packArray(data, type) {
    var length = data.length;
    var packFunction;
    var packedLength;

    switch (type) {
        case WebGLConstants.FLOAT:
        case 'SCALAR':
            return data;
        case WebGLConstants.FLOAT_VEC2:
        case 'VEC2':
            packedLength = Cartesian2.packedLength;
            packFunction = Cartesian2.pack;
            break;
        case WebGLConstants.FLOAT_VEC3:
        case 'VEC3':
            packedLength = Cartesian3.packedLength;
            packFunction = Cartesian3.pack;
            break;
        case WebGLConstants.FLOAT_VEC4:
        case 'VEC4':
            packedLength = Cartesian4.packedLength;
            packFunction = Cartesian4.pack;
            break;
        case WebGLConstants.FLOAT_MAT2:
        case 'MAT2':
            packedLength = Matrix2.packedLength;
            packFunction = Matrix2.pack;
            break;
        case WebGLConstants.FLOAT_MAT3:
        case 'MAT3':
            packedLength = Matrix3.packedLength;
            packFunction = Matrix3.pack;
            break;
        case WebGLConstants.FLOAT_MAT4:
        case 'MAT4':
            packedLength = Matrix4.packedLength;
            packFunction = Matrix4.pack;
            break;
    }
    var packed = new Array(length * packedLength);
    for (var i = 0; i < length; ++i) {
        packFunction(data[i], packed, i * packedLength);
    }

    return packed;
}
