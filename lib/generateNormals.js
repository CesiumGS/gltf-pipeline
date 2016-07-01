'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

var findAccessorMinMax = require('./findAccessorMinMax');
var getUniqueId = require('./getUniqueId');
var mergeBuffers = require('./mergeBuffers');
var readAccessor = require('./readAccessor');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var writeAccessor = require('./writeAccessor');

module.exports = generateNormals;

/**
 * Generates normals for primitives if they do not exist.
 *
 * @param gltf
 */
function generateNormals(gltf) {
    var i;
    var j;
    var index;
    var position;
    var normal;
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
            var oldPositions = readAccessor(gltf, positionAccessor).data;

            // Unpack reused positions and find center
            var indicesLength = indices.length;
            var positions = new Array(indicesLength);
            var normals = new Array(indicesLength);
            var maxIndex = 0;
            for (j = 0; j < indicesLength; j++) {
                index = indices[j];
                maxIndex = Math.max(maxIndex, index);
            }
            var seenIndices = {};
            var nextIndex = maxIndex + 1;
            var center = new Cartesian3();
            for (j = 0; j < indicesLength; j++) {
                index = indices[j];
                position = oldPositions[index];
                if (defined(seenIndices[index])) {
                    positions[nextIndex] = position;
                    indices[j] = nextIndex;
                    nextIndex++;
                } else {
                    positions[index] = position;
                    seenIndices[index] = true;
                }
                Cartesian3.add(center, position, center);
            }
            Cartesian3.divideByScalar(center, indicesLength, center);

            // Add face normal to each vertex normal
            for (j = 0; j < indicesLength; j += 3) {
                var index1 = indices[j];
                var index2 = indices[j + 1];
                var index3 = indices[j + 2];
                var faceNormal = getFaceNormal(positions[index1], positions[index2], positions[index3]);
                normals[index1] = faceNormal;
                normals[index2] = faceNormal.clone();
                normals[index3] = faceNormal.clone();
            }

            // Normalize the normals
            for (j = 0; j < indicesLength; ++j) {
                normal = normals[j];
                Cartesian3.normalize(normal, normal);
            }

            // Place positions and normals into a buffer
            var bufferLength = indicesLength * 3 * 4;
            var normalsBuffer = new Buffer(bufferLength);
            var positionBuffer = new Buffer(bufferLength);
            for (j = 0; j < indicesLength; ++j) {
                normal = normals[j];
                normalsBuffer.writeFloatLE(normal.x, (j * 3 + 0) * 4);
                normalsBuffer.writeFloatLE(normal.y, (j * 3 + 1) * 4);
                normalsBuffer.writeFloatLE(normal.z, (j * 3 + 2) * 4);
                position = positions[j];
                positionBuffer.writeFloatLE(position.x, (j * 3 + 0) * 4);
                positionBuffer.writeFloatLE(position.y, (j * 3 + 1) * 4);
                positionBuffer.writeFloatLE(position.z, (j * 3 + 2) * 4);
            }

            var normalBufferId = getUniqueId(gltf, 'buffer_normal_generated');
            var normalBufferViewId = getUniqueId(gltf, 'bufferView_normal_generated');
            normalAccessorId = getUniqueId(gltf, 'accessor_normal_generated');
            var positionBufferId = getUniqueId(gltf, 'buffer_position_generated');
            var positionBufferViewId = getUniqueId(gltf, 'bufferView_position_generated');
            positionAccessorId = getUniqueId(gltf, 'accessor_position_generated');

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

            gltf.buffers[positionBufferId] = {
                byteLength : bufferLength,
                type : 'arraybuffer',
                extras : {
                    _pipeline : {
                        source : positionBuffer,
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

            gltf.bufferViews[positionBufferViewId] = {
                buffer : positionBufferId,
                byteLength : bufferLength,
                byteOffset : 0,
                target : WebGLConstants.ARRAY_BUFFER
            };

            var normalAccessor = {
                bufferView : normalBufferViewId,
                byteOffset : 0,
                byteStride : 0,
                componentType : WebGLConstants.FLOAT,
                count : indicesLength,
                type : 'VEC3'
            };
            gltf.accessors[normalAccessorId] = normalAccessor;

            positionAccessor = {
                bufferView : positionBufferViewId,
                byteOffset : 0,
                byteStride : 0,
                componentType : WebGLConstants.FLOAT,
                count : indicesLength,
                type : 'VEC3'
            };
            gltf.accessors[positionAccessorId] = positionAccessor;

            // Find min/max for new accessors
            var minMax = findAccessorMinMax(gltf, normalAccessor);
            normalAccessor.min = minMax.min;
            normalAccessor.max = minMax.max;

            minMax = findAccessorMinMax(gltf, positionAccessor);
            positionAccessor.min = minMax.min;
            positionAccessor.max = minMax.max;

            primitive.attributes.NORMAL = normalAccessorId;
            primitive.attributes.POSITION = positionAccessorId;

            // Overwrite with new indices
            writeAccessor(gltf, indicesAccessor, indices);
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

function getFaceNormal(position1, position2, position3) {
    var result = new Cartesian3();
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
