'use strict';
var Cesium = require('cesium');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var PrimitiveHelpers              = require('./PrimitiveHelpers');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;
var getAllPrimitives = PrimitiveHelpers.getAllPrimitives;

module.exports = generateTangentsBinormals;

/**
 * Generates tangents and binormals for primitives if they do not exist.
 *
 * The glTF asset must be initialized for the pipeline. It mus already have normals.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with generated tangents and binormals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateTangentsBinormals(gltf) {       
    var primitives = getAllPrimitives(gltf);
    var primitivesLength = primitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var positionAccessorId = primitive.attributes.POSITION;
        var normalAccessorId   = primitive.attributes.NORMAL;
        var texcoordAccessorId = primitive.attributes.TEXCOORD_0;
        var binormalAccessorId = primitive.attributes.BINORMAL;
        var tangentAccessorId  = primitive.attributes.TANGENT;
        var indicesAccessorId  = primitive.indices;

        if (primitive.mode === WebGLConstants.TRIANGLES &&  defined(indicesAccessorId)  &&
        												    defined(positionAccessorId) &&
        												    defined(normalAccessorId)   &&
        												    defined(texcoordAccessorId) &&
        												   !defined(binormalAccessorId) &&
        												   !defined(tangentAccessorId)    ) {
            var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
            GeometryPipeline.computeBinormalAndTangent(geometry);
            cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
        }
    }
    return gltf;
}
