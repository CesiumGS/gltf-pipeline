'use strict';
var Cesium = require('cesium');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');

var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
var GeometryPipeline = Cesium.GeometryPipeline;

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
    var primitives = getPrimitives(gltf);
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

//TODO: copied from generateNormals, could be shared
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
