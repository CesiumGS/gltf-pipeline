'use strict';
var findAccessorMinMax = require('./findAccessorMinMax');
var mergeBuffers = require('./mergeBuffers');
var readAccessor = require('./readAccessor');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
module.exports = generateNormals;

var scratchNormal = new Cartesian3();

// Generate normals if they do not exist.
function generateNormals(gltf) {
    var i;
    var j;
    var generatedNormals = false;
    var primitives = getPrimitives(gltf);
    var primitivesLength = primitives.length;
    for (i = 0; i < primitivesLength; ++i) {
        var primitive = primitives[i];
        var positionAccessorId = primitive.attributes.POSITION;
        var normalAccessorId = primitive.attributes.NORMAL;
        var indicesAccessorId = primitive.indices;
        if (primitive.mode === WebGLConstants.TRIANGLES && defined(indicesAccessorId) && defined(positionAccessorId) && !defined(normalAccessorId)) {
            generatedNormals = true;
            var indicesAccessor = gltf.accessors[indicesAccessorId];
            var positionAccessor = gltf.accessors[positionAccessorId];
            var indices = readAccessor(gltf, indicesAccessor).data;
            var positions = readAccessor(gltf, positionAccessor).data;

            // Generate one normal for each position
            var normalsLength = positions.length;
            var trianglesLength = indices.length / 3;

            // Initialize the normals to 0
            var normals = new Array(normalsLength);
            for (j = 0; j < normalsLength; j++) {
                normals[j] = new Cartesian3();
            }

            // Add face normal to each vertex normal
            for (j = 0; j < trianglesLength; ++j) {
                var index1 = indices[j * 3 + 0];
                var index2 = indices[j * 3 + 1];
                var index3 = indices[j * 3 + 2];
                var faceNormal = getFaceNormal(positions[index1], positions[index2], positions[index3], scratchNormal);
                Cartesian3.add(normals[index1], faceNormal, normals[index1]);
                Cartesian3.add(normals[index2], faceNormal, normals[index2]);
                Cartesian3.add(normals[index3], faceNormal, normals[index3]);
            }

            // Normalize the normals
            for (j = 0; j < normalsLength; ++j) {
                Cartesian3.normalize(normals[j], normals[j]);
            }

            // Place normals into a buffer
            var bufferLength = normalsLength * 3 * 4;
            var normalsBuffer = new Buffer(bufferLength);
            for (j = 0; j < normalsLength; ++j) {
                var normal = normals[j];
                normalsBuffer.writeFloatLE(normal.x, (j * 3 + 0) * 4);
                normalsBuffer.writeFloatLE(normal.y, (j * 3 + 1) * 4);
                normalsBuffer.writeFloatLE(normal.z, (j * 3 + 2) * 4);
            }

            var normalBufferId = 'buffer_normal_generated_' + i;
            var normalBufferViewId = 'bufferView_normal_generated_' + i;
            normalAccessorId = 'accessor_normal_generated_' + i;

            gltf.buffers[normalBufferId] = {
                byteLength : bufferLength,
                type : 'arraybuffer',
                extras : {
                    _pipeline : {
                        source : normalsBuffer,
                        extension : '.bin'
                    }
                }
            };

            gltf.bufferViews[normalBufferViewId] = {
                buffer : normalBufferId,
                byteLength : bufferLength,
                byteOffset : 0,
                target : WebGLConstants.ARRAY_BUFFER
            };

            var normalAccessor = {
                bufferView : normalBufferViewId,
                byteOffset : 0,
                byteStride : 0,
                componentType : WebGLConstants.FLOAT,
                count : normalsLength,
                type : 'VEC3'
            };

            gltf.accessors[normalAccessorId] = normalAccessor;

            // Find min/max for normal accessor
            var minMax = findAccessorMinMax(gltf, normalAccessor);
            normalAccessor.min = minMax.min;
            normalAccessor.max = minMax.max;

            primitive.attributes.NORMAL = normalAccessorId;
        }
    }

    if (generatedNormals) {
        // Repack the buffers
        mergeBuffers(gltf, 'buffer_0');
        uninterleaveAndPackBuffers(gltf);
    }
}

var scratchEdge1 = new Cartesian3();
var scratchEdge2 = new Cartesian3();

function getFaceNormal(position1, position2, position3, result) {
    var edge1 = Cartesian3.subtract(position2, position1, scratchEdge1);
    var edge2 = Cartesian3.subtract(position3, position1, scratchEdge2);
    Cartesian3.cross(edge1, edge2, result);
    Cartesian3.normalize(result, result);
    return result;
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
