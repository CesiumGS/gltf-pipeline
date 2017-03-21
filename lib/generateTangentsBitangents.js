'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;

module.exports = generateTangentsBitangents;

/**
 * Generates tangents and bitangents for primitives if they do not exist.
 *
 * The glTF asset must be initialized for the pipeline. It must already have normals.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with generated tangents and bitangents.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateTangentsBitangents(gltf) {
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitives(mesh, function(primitive) {
            var positionAccessorId  = primitive.attributes.POSITION;
            var normalAccessorId  = primitive.attributes.NORMAL;
            var texcoordAccessorId = primitive.attributes.TEXCOORD_0;
            var bitangentAccessorId = primitive.attributes.BITANGENT;
            var tangentAccessorId = primitive.attributes.TANGENT;
            var indicesAccessorId = primitive.indices;

            if (primitive.mode === WebGLConstants.TRIANGLES &&
                   defined(indicesAccessorId) &&
                   defined(positionAccessorId) &&
                   defined(normalAccessorId) &&
                   defined(texcoordAccessorId) &&
                   !defined(bitangentAccessorId) &&
                   !defined(tangentAccessorId)) {
               var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
               GeometryPipeline.computeTangentAndBitangent(geometry);
               cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
        });
    });
    return gltf;
}