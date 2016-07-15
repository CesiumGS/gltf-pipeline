'use strict';
var readAccessor = require('./readAccessor');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var Cesium = require('cesium');
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;

var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var mergeBuffers = require('./mergeBuffers');


module.exports = generateNormals;

/**
 * Generates normals for primitives if they do not exist.
 *
 * @param gltf
 */
function generateNormals(gltf) {
    var primitives = getPrimitives(gltf);
    var primitivesLength = primitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var positionAccessorId = primitive.attributes.POSITION;
        var normalAccessorId = primitive.attributes.NORMAL;
        var indicesAccessorId = primitive.indices;
        var positionAccessor = gltf.accessors[positionAccessorId];
        var position = [];
        readAccessor(gltf, positionAccessor, position);

        if (primitive.mode === WebGLConstants.TRIANGLES && defined(indicesAccessorId) && defined(positionAccessorId) && !defined(normalAccessorId)) {
            // console.log('BEFORE : ');
            // console.log(primitive);
            var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
            GeometryPipeline.computeNormal(geometry);
            cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            // console.log('AFTER : ');
            // console.log(primitive);
        }
    }
}

function getPrimitives(gltf) {
    var primitives = [];
    var nodes = gltf.nodes;
    var meshes = gltf.meshes;
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                var node = nodes[nodeId];
                var nodeMeshes = node.meshes;
                if (defined(nodeMeshes) && nodeMeshes.length > 0) {
                    for (var i = 0; i < nodeMeshes.length; i++) {
                        var meshPrimitives = meshes[nodeMeshes[i]].primitives;
                        if (defined(meshPrimitives)) {
                            for (var j = 0; j < meshPrimitives.length; j++) {
                                primitives.push(meshPrimitives[j]);
                            }
                        }
                    }
                }
            }
        }
    }
    return primitives;
}
