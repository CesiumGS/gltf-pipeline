'use strict';
var Cesium = require('cesium');

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

var AccessorReader = require('./AccessorReader');

module.exports = readAccessor;

/**
 * Reads data from
 *
 * @param {Object} gltf
 * @param {Object} accessor
 * @param {Array} results
 * @returns {Number}
 */
function readAccessor(gltf, accessor, results) {
    var generateAttributeFunction;
    var type;
    var accessorReader = new AccessorReader(gltf, accessor);
    var accessorType = accessor.type;

    switch (accessorType) {
        case 'SCALAR':
            generateAttributeFunction = function(results) {
                return results[0];
            };
            type = WebGLConstants.FLOAT;
            break;
        case 'VEC2':
            generateAttributeFunction = Cartesian2.fromArray;
            type = WebGLConstants.FLOAT_VEC2;
            break;
        case 'VEC3':
            generateAttributeFunction = Cartesian3.fromArray;
            type = WebGLConstants.FLOAT_VEC3;
            break;
        case 'VEC4':
            generateAttributeFunction = Cartesian4.fromArray;
            type = WebGLConstants.FLOAT_VEC4;
            break;
        case 'MAT2':
            generateAttributeFunction = Matrix2.fromArray;
            type = WebGLConstants.FLOAT_MAT2;
            break;
        case 'MAT3':
            generateAttributeFunction = Matrix3.fromArray;
            type = WebGLConstants.FLOAT_MAT3;
            break;
        case 'MAT4':
            generateAttributeFunction = Matrix4.fromArray;
            type = WebGLConstants.FLOAT_MAT4;
            break;
    }

    var components = [];
    while(defined(accessorReader.read(components))) {
        results.push(generateAttributeFunction(components));
    }
    return type;
}
