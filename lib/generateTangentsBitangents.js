'use strict';
var Cesium = require('cesium');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var PrimitiveHelpers              = require('./PrimitiveHelpers');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;
var getAllPrimitives = PrimitiveHelpers.getAllPrimitives;

module.exports = generateTangentsBitangents;

/**
 * Generates tangents and bitangents for primitives if they do not exist.
 *
 * The glTF asset must be initialized for the pipeline. It mus already have normals.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with generated tangents and bitangents.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateTangentsBitangents(gltf) {
    var primitives = getAllPrimitives(gltf);
    var primitivesLength = primitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var positionAccessorId  = primitive.attributes.POSITION;
        var normalAccessorId    = primitive.attributes.NORMAL;
        var texcoordAccessorId  = primitive.attributes.TEXCOORD_0;
        var bitangentAccessorId = primitive.attributes.BITANGENT;
        var tangentAccessorId   = primitive.attributes.TANGENT;
        var indicesAccessorId   = primitive.indices;

        if (primitive.mode === WebGLConstants.TRIANGLES &&  defined(indicesAccessorId)   &&
                                                            defined(positionAccessorId)  &&
                                                            defined(normalAccessorId)    &&
                                                            defined(texcoordAccessorId)  &&
                                                           !defined(bitangentAccessorId) &&
                                                           !defined(tangentAccessorId)    ) {
            var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
            GeometryPipeline.computeTangentAndBitangent(geometry);
            cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
        }
    }
    return gltf;
}
