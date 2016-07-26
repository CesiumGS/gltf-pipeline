'use strict';
var Cesium = require('cesium');
var jp = require('jsonpath');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;

var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');

module.exports = generateNormals;

/**
 * Generates normals for primitives if they do not exist.
 *
 * @param gltf
 */
function generateNormals(gltf) {
    jp.apply(gltf, '$.meshes[*].primitives[*]', function (primitive) {
        var positionAccessorId = primitive.attributes.POSITION;
        var normalAccessorId = primitive.attributes.NORMAL;
        var indicesAccessorId = primitive.indices;

        if (primitive.mode === WebGLConstants.TRIANGLES && defined(indicesAccessorId) && defined(positionAccessorId) && !defined(normalAccessorId)) {
            var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
            GeometryPipeline.computeNormal(geometry);
            cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
        }
        return primitive;
    });
}
