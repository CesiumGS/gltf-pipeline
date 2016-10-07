'use strict';
var Cesium = require('cesium');
var deepEqual = require('deep-equal');

var Cartesian3 = Cesium.Cartesian3;
var Matrix4 = Cesium.Matrix4;
var defined = Cesium.defined;

var AccessorReader = require('./AccessorReader');
var readAccessor = require('./readAccessor');
var writeAccessor = require('./writeAccessor');

module.exports = {
    getAllPrimitives : getAllPrimitives,
    getPrimitivesByMaterialMode : getPrimitivesByMaterialMode,
    markPrimitiveConflicts : markPrimitiveConflicts,
    primitiveEquals : primitiveEquals,
    primitivesShareAttributeAccessor : primitivesShareAttributeAccessor,
    primitivesHaveOverlappingIndexAccessors : primitivesHaveOverlappingIndexAccessors,
    transformPrimitives : transformPrimitives
};


function primitivesShareAttributeAccessor(primitive, comparePrimitive) {
    var attributes = primitive.attributes;
    var compareAttributes = comparePrimitive.attributes;
    for (var attribute in attributes) {
        if (attributes.hasOwnProperty(attribute)) {
            if (compareAttributes.hasOwnProperty(attribute)) {
                if (attributes[attribute] === compareAttributes[attribute]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function primitivesHaveOverlappingIndexAccessors(gltf, primitive, comparePrimitive) {
    var accessors = gltf.accessors;
    var indexAccessorId = primitive.indices;
    var compareIndexAccessorId = comparePrimitive.indices;
    if (!defined(indexAccessorId) || !defined(compareIndexAccessorId)) {
        return false;
    }
    if (indexAccessorId === compareIndexAccessorId) {
        return true;
    }
    var indexAccessor = accessors[indexAccessorId];
    var compareIndexAccessor = accessors[compareIndexAccessorId];
    var indices = [];
    readAccessor(gltf, indexAccessor, indices);
    var accessorReader = new AccessorReader(gltf, compareIndexAccessor);
    var value = [];

    while(accessorReader.hasNext()) {
        var index = accessorReader.read(value)[0];
        if (indices.indexOf(index) >= 0) {
            return true;
        }
        accessorReader.next();
    }
    return false;
}

function transformPrimitives(gltf, primitives, transform) {
    var inverseTranspose = new Matrix4();
    if (Matrix4.equals(transform, Matrix4.IDENTITY)) {
        return;
    }
    var accessors = gltf.accessors;
    Matrix4.inverseTransformation(transform, inverseTranspose);
    Matrix4.transpose(inverseTranspose, inverseTranspose);

    var packedPositions = [];
    var packedNormals = [];

    var primitivesLength = primitives.length;
    var doneIndicesByAccessor = {};
    for (var i = 0; i < primitivesLength; i++) {
        var indices = [];
        var positions = [];
        var normals = [];

        var primitive = primitives[i];
        var attributes = primitive.attributes;
        var positionSemantic;
        var normalSemantic;
        for (var attribute in attributes) {
            if (defined(positionSemantic) && defined(normalSemantic)) {
                break;
            } else if (attribute.indexOf('POSITION') === 0) {
                positionSemantic = attribute;
            } else if (attribute.indexOf('NORMAL') === 0) {
                normalSemantic = attribute;
            }
        }
        var indexAccessorId = primitive.indices;
        var positionAccessorId = attributes[positionSemantic];
        var normalAccessorId = attributes[normalSemantic];
        if (defined(positionSemantic) && defined(normalSemantic)) {
            readAccessor(gltf, accessors[positionAccessorId], positions);
            readAccessor(gltf, accessors[normalAccessorId], normals);
            if (defined(indexAccessorId)) {
                readAccessor(gltf, accessors[indexAccessorId], indices);
            } else if (positions.length === normals.length) {
                indices = Array.from(new Array(positions.length), generateIndices);
            }
            var indicesLength = indices.length;
            var donePositionIndices = doneIndicesByAccessor[positionAccessorId];
            var doneNormalIndices = doneIndicesByAccessor[normalAccessorId];
            if (!defined(donePositionIndices)) {
                donePositionIndices = {};
                doneIndicesByAccessor[positionAccessorId] = donePositionIndices;
            }
            if (!defined(doneNormalIndices)) {
                doneNormalIndices = {};
                doneIndicesByAccessor[normalAccessorId] = doneNormalIndices;
            }
            for (var j = 0; j < indicesLength; j++) {
                var index = indices[j];
                if (!defined(donePositionIndices[index])) {
                    donePositionIndices[index] = true;
                    var position = positions[index];
                    Matrix4.multiplyByPoint(transform, position, position);
                }
                if (!defined(doneNormalIndices[index])) {
                    doneNormalIndices[index] = true;
                    var normal = normals[index];
                    Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
                }
            }
            Cartesian3.packArray(positions, packedPositions);
            Cartesian3.packArray(normals, packedNormals);
            writeAccessor(gltf, accessors[positionAccessorId], packedPositions);
            writeAccessor(gltf, accessors[normalAccessorId], packedNormals);
        }
    }
}

function getPrimitivesByMaterialMode(primitives) {
    var primitivesLength = primitives.length;
    var primitivesByMaterialMode = {};
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var materialId = primitive.material;
        var primitivesByMode = primitivesByMaterialMode[materialId];
        if (!defined(primitivesByMode)) {
            primitivesByMode = {};
            primitivesByMaterialMode[materialId] = primitivesByMode;
        }
        var mode = primitive.mode;
        var primitivesArray = primitivesByMode[mode];
        if (!defined(primitivesArray)) {
            primitivesArray = [];
            primitivesByMode[mode] = primitivesArray;
        }
        primitivesArray.push(primitive);
    }
    return primitivesByMaterialMode;
}

function markPrimitiveConflicts(gltf, primitives) {
    var i, j, k;
    var primitivesLength = primitives.length;
    for (i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        primitive.extras._pipeline.conflicts = [];
    }
    for (i = 0; i < primitivesLength; i++) {
        var primitiveOne = primitives[i];
        for (j = i + 1; j < primitivesLength; j++) {
            var primitiveTwo = primitives[j];
            if (primitivesShareAttributeAccessor(primitiveOne, primitiveTwo)) {
                if (primitivesHaveOverlappingIndexAccessors(gltf, primitiveOne, primitiveTwo)) {
                    var primitiveOneConflicts = primitiveOne.extras._pipeline.conflicts;
                    var primitiveTwoConflicts = primitiveTwo.extras._pipeline.conflicts;
                    var primitiveOneConflictsLength = primitiveOneConflicts.length;
                    for (k = 0; k < primitiveOneConflictsLength; k++) {
                        var conflictingPrimitive = primitiveOneConflicts[k];
                        conflictingPrimitive.extras._pipeline.conflicts.push(primitiveTwo);
                        primitiveTwoConflicts.push(conflictingPrimitive);
                    }
                    primitiveOneConflicts.push(primitiveTwo);
                    primitiveTwoConflicts.push(primitiveOne);
                    break;
                }
            }
        }
    }
}

function getAllPrimitives(gltf) {
    var primitives = [];
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            primitives = primitives.concat(mesh.primitives);
        }
    }
    return primitives;
}

function generateIndices(v, k) {
    void(v); // v is an unused parameter
    return k;
}

function primitiveEquals(primitiveOne, primitiveTwo) {
    return primitiveOne.mode === primitiveTwo.mode &&
            primitiveOne.material === primitiveTwo.material &&
            primitiveOne.indices === primitiveTwo.indices &&
            deepEqual(primitiveOne.attributes, primitiveTwo.attributes);
}