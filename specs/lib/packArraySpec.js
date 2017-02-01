'use strict';
var packArray = require('../../lib/packArray');
var Cesium = require('cesium');
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;

var cartesian2 = [new Cartesian2(0, 1), new Cartesian2(2, 3), new Cartesian2(4, 5),
    new Cartesian2(6, 7), new Cartesian2(8, 9), new Cartesian2(10, 11)];
var cartesian3 = [new Cartesian3(0, 1, 2), new Cartesian3(3, 4, 5),
    new Cartesian3(6, 7, 8), new Cartesian3(9, 10, 11)];
var cartesian4 = [new Cartesian4(0, 1, 2, 3), new Cartesian4(4, 5, 6, 7),
    new Cartesian4(8, 9, 10, 11)];

var packedCartesians = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

var matrix2 = [new Matrix2(0, 2,
                           1, 3)];
var matrix3 = [new Matrix3(0, 3, 6,
                           1, 4, 7,
                           2, 5, 8)];
var matrix4 = [new Matrix4( 0,  4,  8, 12,
                            1,  5,  9, 13,
                            2,  6, 10, 14,
                            3,  7, 11, 15 )];

var packedMatrix2 = [0, 1, 2, 3];
var packedMatrix3 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
var packedMatrix4 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe('packArray', function() {
    it('packs an array with numbers', function() {
        var packed = packArray(packedCartesians, WebGLConstants.FLOAT);
        expect(packed).toEqual(packedCartesians);
    });

    it('packs an array with Cartesians', function() {
        var array2 = packArray(cartesian2, WebGLConstants.FLOAT_VEC2);
        var array3 = packArray(cartesian3, WebGLConstants.FLOAT_VEC3);
        var array4 = packArray(cartesian4, WebGLConstants.FLOAT_VEC4);

        expect(array2).toEqual(packedCartesians);
        expect(array3).toEqual(packedCartesians);
        expect(array4).toEqual(packedCartesians);
    });

    it('packs an array with Matrices', function() {
        var array2 = packArray(matrix2, WebGLConstants.FLOAT_MAT2);
        var array3 = packArray(matrix3, WebGLConstants.FLOAT_MAT3);
        var array4 = packArray(matrix4, WebGLConstants.FLOAT_MAT4);

        expect(array2).toEqual(packedMatrix2);
        expect(array3).toEqual(packedMatrix3);
        expect(array4).toEqual(packedMatrix4);
    });
});
