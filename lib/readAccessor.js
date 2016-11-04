'use strict';
var Cesium = require('cesium');

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;

var AccessorReader = require('./AccessorReader');

module.exports = readAccessor;

/**
 * Reads data from the provided accessor into an array of Cesium types.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} accessor The glTF accessor to read.
 * @param {Array} results The resulting Cesium data structures are pushed into results.
 * @returns {Number} The WebGLConstants type used to generate the Cesium data structures. (e.g. WebGLConstants.FLOAT_VEC3 for Cartesian3)
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function readAccessor(gltf, accessor, results, generateAttributes) {
    generateAttributes = defaultValue(generateAttributes, true);
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
    while(!accessorReader.pastEnd()) {
        accessorReader.read(components);
        if (generateAttributes) {
            results.push(generateAttributeFunction(components));
        } else {
            var componentsLength = components.length;
            for (var i = 0; i < componentsLength; i++) {
                results.push(components[i]);
            }
        }
        accessorReader.next();
    }
    return type;
}
