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
var combinePrimitives = require('./combinePrimitives');

module.exports = generateNormals;


function hardNormals(oldPositions, indices) {
    // Unpack reused positions and find center
    var indicesLength = indices.length;
    var positions = new Array(indicesLength);
    var normals = new Array(indicesLength);
    var maxIndex = 0;
    var index;
    var i;
    for (i = 0; i < indicesLength; i++) {
        index = indices[i];
        maxIndex = Math.max(maxIndex, index);
    }
    var seenIndices = {};
    var nextIndex = maxIndex + 1;
    for (i = 0; i < indicesLength; i++) {
        index = indices[i];
        var position = oldPositions[index];
        if (defined(seenIndices[index])) {
            positions[nextIndex] = position;
            indices[i] = nextIndex;
            nextIndex++;
        } else {
            positions[index] = position;
            seenIndices[index] = true;
        }
    }

    // Add face normal to each vertex normal
    for (i = 0; i < indicesLength; i += 3) {
        var index1 = indices[i];
        var index2 = indices[i + 1];
        var index3 = indices[i + 2];
        var faceNormal = getFaceNormal(positions[index1], positions[index2], positions[index3]);
        normals[index1] = faceNormal;
        normals[index2] = faceNormal.clone();
        normals[index3] = faceNormal.clone();
    }
    return {
        normals : normals,
        positions : positions,
        maxIndex : nextIndex - 1
    };
}

function softNormals(positions, indices) {
    // Generate one normal for each position
    var normalsLength = positions.length;
    var trianglesLength = indices.length / 3;

    // Initialize the normals to 0
    var normals = new Array(normalsLength);
    for (var i  = 0; i < normalsLength; i++) {
        normals[i] = new Cartesian3();
    }

    // Add face normal to each vertex normal
    for (i = 0; i < trianglesLength; ++i) {
        var index1 = indices[i * 3 + 0];
        var index2 = indices[i * 3 + 1];
        var index3 = indices[i * 3 + 2];
        var faceNormal = getFaceNormal(positions[index1], positions[index2], positions[index3]);
        Cartesian3.add(normals[index1], faceNormal, normals[index1]);
        Cartesian3.add(normals[index2], faceNormal, normals[index2]);
        Cartesian3.add(normals[index3], faceNormal, normals[index3]);
    }
    return normals;
}

/**
 * Generates normals for primitives if they do not exist.
 *
 * @param gltf
 * @param {boolean} isHard
 */
function generateNormals(gltf, isHard) {
    var i;
    var j;
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
            var indices = [];
            readAccessor(gltf, indicesAccessor, indices);
            var positions = [];
            readAccessor(gltf, positionAccessor, positions);
            var normals;

            var maxIndex;
            if (isHard) {
                var results = hardNormals(positions, indices);
                normals = results.normals;
                positions = results.positions;
                maxIndex = results.maxIndex;
            } else {
                normals = softNormals(positions, indices);
            }

            // Normalize the normals
            var normalsLength = normals.length;
            for (j = 0; j < normalsLength; ++j) {
                normal = normals[j];
                Cartesian3.normalize(normal, normal);
            }

            // Upper bound of UInt16
            if (maxIndex > 65535) {
                splitPrimitive(gltf, primitive, positions, normals, indices);
                
            } else {
                createBuffers(gltf, primitive, positions, normals, indices);
            }


            // **** //
            // Check for splitPrimitives here
            // **** //

            /*
            
            // Place positions and normals into a buffer
            var bufferLength = normalsLength * 3 * 4;
            var normalsBuffer = new Buffer(bufferLength);
            var positionBuffer = new Buffer(bufferLength);
            for (j = 0; j < normalsLength; ++j) {
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
                count : normalsLength,
                type : 'VEC3'
            };
            gltf.accessors[normalAccessorId] = normalAccessor;

            positionAccessor = {
                bufferView : positionBufferViewId,
                byteOffset : 0,
                byteStride : 0,
                componentType : WebGLConstants.FLOAT,
                count : positions.length,
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
            */
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

function primitiveToMeshPrimitives(gltf, primitive) {
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
                                if (primitive == meshPrimitives[j]) {
                                    return meshPrimitives;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function splitPrimitive(gltf, primitive, positions, normals, indices) {
    var maxUInt = 65535;
    var lowIndices = [];
    var highIndices = [];
    // Split indices into groups of those above and below maxUInt value
    for (var i = 0; i < indices.length; i += 3) {
        var index0 = indices[i];
        var index1 = indices[i + 1];
        var index2 = indices[i + 2];
        if (index0 > maxUInt || index1 > maxUInt || index2 > maxUInt) {
            highIndices.push(index0);
            highIndices.push(index1);
            highIndices.push(index2);
        } else {
            lowIndices.push(index0);
            lowIndices.push(index1);
            lowIndices.push(index2);
        }
    }

    // Reindex low positions and normals
    var index;
    var position;
    var normal;
    var lowestIndex = 0;
    // seenPositionAndNormal[position] -> seenNormals[normal] -> index
    // Symbol table for tracking repeat indices
    var seenPositionAndNormal = {};
    var seenNormals;
    var lowPositions = [];
    var lowNormals = [];
    for (i = 0; i < lowIndices.length; i++) {
        index = lowIndices[i];
        position = positions[index];
        normal = normals[index];

        if (defined(seenPositionAndNormal[position])) {
            if (!defined(seenPositionAndNormal[position][normal])) {
                lowPositions.push(position);
                lowNormals.push(normal);
                seenPositionAndNormal[position][normal] = lowestIndex++;
            }
        } else {
            seenNormals = {};
            seenNormals[normal] = lowestIndex;
            seenPositionAndNormal[position] = seenNormals;
        }
        lowIndices[i] = seenPositionAndNormal[position][normal];
    }

    // Reindex high positions and normals
    lowestIndex = 0;
    seenPositionAndNormal = {};
    var highPositions = [];
    var highNormals = [];
    for (i = 0; i < highIndices.length; i++) {
        index = highIndices[i];
        position = positions[index];
        normal = normals[index];

        if (defined(seenPositionAndNormal[position])) {
            if (!defined(seenPositionAndNormal[position][normal])) {
                highPositions.push(position);
                highNormals.push(normal);
                seenPositionAndNormal[position][normal] = lowestIndex++;
            }
        } else {
            seenNormals = {};
            seenNormals[normal] = lowestIndex;
            seenPositionAndNormal[position] = seenNormals;
        }
        highIndices[i] = seenPositionAndNormal[position][normal];

    }

    var maxIndex = lowestIndex - 1;

    if (maxIndex > maxUInt) {
        createBuffers(gltf, primitive, lowPositions, lowNormals, lowIndices);
        splitPrimitive(gltf, primitive, highPositions, highNormals, highIndices);
        // writeAccessor(gltf, leftIndicesAccessor, leftIndices)
    } else {
        createBuffers(gltf, primitive, lowPositions, lowNormals, lowIndices);
        createBuffers(gltf, primitive, highPositions, highNormals, highIndices);
    }
}

function createBuffers(gltf, primitive, positions, normals, indices) {
    // Place positions and normals into a buffer
    var bufferLength = normals.length * 3 * 4;
    var normalsBuffer = new Buffer(bufferLength);
    var positionBuffer = new Buffer(bufferLength);
    for (var i = 0; i < normals.length; ++i) {
        var normal = normals[i];
        normalsBuffer.writeFloatLE(normal.x, (i * 3 + 0) * 4);
        normalsBuffer.writeFloatLE(normal.y, (i * 3 + 1) * 4);
        normalsBuffer.writeFloatLE(normal.z, (i * 3 + 2) * 4);
        var position = positions[i];
        positionBuffer.writeFloatLE(position.x, (i * 3 + 0) * 4);
        positionBuffer.writeFloatLE(position.y, (i * 3 + 1) * 4);
        positionBuffer.writeFloatLE(position.z, (i * 3 + 2) * 4);
    }

    var indicesBufferLength = indices.length * 4;
    var indicesBuffer = new Buffer(indicesBufferLength);
    for (i = 0; i < indices.length; i++) {
        var index = indices[i];
        indicesBuffer.writeUInt16LE(index, i * 4);
    }

    var normalBufferId = getUniqueId(gltf, 'buffer_normal_generated');
    var normalBufferViewId = getUniqueId(gltf, 'bufferView_normal_generated');
    var normalAccessorId = getUniqueId(gltf, 'accessor_normal_generated');
    var positionBufferId = getUniqueId(gltf, 'buffer_position_generated');
    var positionBufferViewId = getUniqueId(gltf, 'bufferView_position_generated');
    var positionAccessorId = getUniqueId(gltf, 'accessor_position_generated');
    var indexBufferId = getUniqueId(gltf, 'buffer_index_generated');
    var indexBufferViewId = getUniqueId(gltf, 'bufferView_index_generated');
    var indexAccessorId = getUniqueId(gltf, 'accessor_index_generated');

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

    gltf.buffers[indexBufferId] = {
        byteLength : indicesBufferLength,
        type : 'arraybuffer',
        extras : {
            _pipeline : {
                source : indicesBuffer,
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

    gltf.bufferViews[indexBufferViewId] = {
        buffer : indexBufferId,
        byteLength : indicesBufferLength,
        byteOffset : 0,
        target : WebGLConstants.ARRAY_BUFFER
    };

    var normalAccessor = {
        bufferView : normalBufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.FLOAT,
        count : normals.length,
        type : 'VEC3'
    };
    gltf.accessors[normalAccessorId] = normalAccessor;
    
    var positionAccessor = {
        bufferView : positionBufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.FLOAT,
        count : positions.length,
        type : 'VEC3'
    };
    gltf.accessors[positionAccessorId] = positionAccessor;

    var indexAccessor = {
        bufferView : indexBufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.UNSIGNED_SHORT,
        count : indices.length,
        type : 'SCALAR'
    };
    gltf.accessors[indexAccessorId] = indexAccessor;

    // Find min/max for new accessors
    var minMax = findAccessorMinMax(gltf, normalAccessor);
    normalAccessor.min = minMax.min;
    normalAccessor.max = minMax.max;

    minMax = findAccessorMinMax(gltf, positionAccessor);
    positionAccessor.min = minMax.min;
    positionAccessor.max = minMax.max;

    minMax = findAccessorMinMax(gltf, indexAccessor);
    indexAccessor.min = minMax.min;
    indexAccessor.max = minMax.max;
    
    var newAttributes = {
        POSITION : positionAccessorId,
        NORMAL : normalAccessorId
    };
    var newPrimitive = {
        attributes : newAttributes,
        indices : indexAccessorId,
        material : primitive.material,
        mode : primitive.mode
    };

    var meshPrimitives = primitiveToMeshPrimitives(gltf, primitive);

    meshPrimitives.push(newPrimitive);
}
