'use strict';
var Cesium = require('cesium');
var deepEqual = require('deep-equal');
var AccessorReader = require('./AccessorReader');
var getPrimitiveAttributeSemantics = require('./getPrimitiveAttributeSemantics');
var readAccessor = require('./readAccessor');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian3 = Cesium.Cartesian3;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

module.exports = {
    getAllPrimitives : getAllPrimitives,
    getPrimitivesByMaterialMode : getPrimitivesByMaterialMode,
    getPrimitiveConflicts : getPrimitiveConflicts,
    primitiveEquals : primitiveEquals,
    primitivesShareAttributeAccessor: primitivesShareAttributeAccessor,
    primitivesHaveOverlappingIndexAccessors : primitivesHaveOverlappingIndexAccessors,
    transformPrimitives : transformPrimitives
};

/**
 * Compare two primitives to check if they share an attribute accessor.
 *
 * @param {Object} primitive The first primitive to compare.
 * @param {Object} comparePrimitive The second primitive to compare.
 * @param {String[]} [attributesToCheck] An array of attributes to check for sharing. Defaults to checking all attributes.
 * @returns {Boolean} True if primitives share an attribute, false otherwise.
 */
function primitivesShareAttributeAccessor(primitive, comparePrimitive, attributesToCheck) {
    var attributes = primitive.attributes;
    var compareAttributes = comparePrimitive.attributes;
    for (var attribute in attributes) {
        if (!defined(attributesToCheck) || (attributesToCheck.indexOf(attribute) !== -1)) {
            if (attributes.hasOwnProperty(attribute)) {
                if (compareAttributes.hasOwnProperty(attribute)) {
                    if (attributes[attribute] === compareAttributes[attribute]) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Compare two primitives to check if they have an overlapping index accessor.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive The first primitive to compare.
 * @param {Object} comparePrimitive The second primitive to compare.
 * @returns {Boolean} True if primitives have an overlapping index accessor, false otherwise.
 */
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

    while (!accessorReader.pastEnd()) {
        var index = accessorReader.read(value)[0];
        if (indices.indexOf(index) >= 0) {
            return true;
        }
        accessorReader.next();
    }
    return false;
}

/**
 * Apply a given transform to an array of primitives.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object[]} primitives An array containing the primitives that need to be transformed.
 * @param {Matrix4} transform The transform to apply to the primitives.
 */
function transformPrimitives(gltf, primitives, transform) {
    var inverseTranspose = new Matrix4();
    if (Matrix4.equals(transform, Matrix4.IDENTITY)) {
        return;
    }
    var accessors = gltf.accessors;
    Matrix4.inverseTransformation(transform, inverseTranspose);
    Matrix4.transpose(inverseTranspose, inverseTranspose);

    var scratchIndexArray = [];
    var scratchCartesianArray = [];
    var scratchCartesian = new Cartesian3();
    var doneIndicesByAccessor = {};

    var primitivesLength = primitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var attributes = primitive.attributes;
        var indexAccessorReader;
        var index = 0;
        if (defined(primitive.indices)) {
            indexAccessorReader = new AccessorReader(gltf, accessors[primitive.indices]);
            indexAccessorReader.read(scratchIndexArray);
            index = scratchIndexArray[0];
        }
        var positionAccessorReader;
        var positionSemantics = getPrimitiveAttributeSemantics(primitive, 'POSITION');
        var positionAccessorId = attributes[positionSemantics[0]];
        if (positionSemantics.length > 0) {
            doneIndicesByAccessor[positionAccessorId] = {};
            positionAccessorReader = new AccessorReader(gltf, accessors[positionAccessorId]);
        }
        var normalAccessorReader;
        var normalSemantics = getPrimitiveAttributeSemantics(primitive, 'NORMAL');
        var normalAccessorId = attributes[normalSemantics[0]];
        var isOctEncoded = false;
        if (normalSemantics.length > 0) {
            doneIndicesByAccessor[normalAccessorId] = {};
            var normalAccessor = accessors[normalAccessorId];
            normalAccessorReader = new AccessorReader(gltf, normalAccessor);
            isOctEncoded = normalAccessor.type === 'VEC2';
        }
        var keepReading = true;
        while (keepReading) {
            if (defined(positionAccessorReader) && !doneIndicesByAccessor[positionAccessorId][index]) {
                positionAccessorReader.index = index;
                positionAccessorReader.read(scratchCartesianArray);
                Cartesian3.unpack(scratchCartesianArray, 0, scratchCartesian);
                Matrix4.multiplyByPoint(transform, scratchCartesian, scratchCartesian);
                Cartesian3.pack(scratchCartesian, scratchCartesianArray);
                positionAccessorReader.write(scratchCartesianArray);
                doneIndicesByAccessor[positionAccessorId][index] = true;
            }
            if (defined(normalAccessorReader) && !doneIndicesByAccessor[normalAccessorId][index]) {
                normalAccessorReader.index = index;
                normalAccessorReader.read(scratchCartesianArray);
                Cartesian3.unpack(scratchCartesianArray, 0, scratchCartesian);
                if (isOctEncoded) {
                    // Un-encode oct-encoded normals
                    if (normalAccessorReader.componentType === WebGLConstants.BYTE) {
                        // Normalize if these are written to signed bytes
                        scratchCartesian.x += 128;
                        scratchCartesian.y += 128;
                    }
                    AttributeCompression.octDecode(scratchCartesian.x, scratchCartesian.y, scratchCartesian);
                }
                Matrix4.multiplyByPointAsVector(inverseTranspose, scratchCartesian, scratchCartesian);
                Cartesian3.normalize(scratchCartesian, scratchCartesian);
                if (isOctEncoded) {
                    // Re-encode oct-encoded normals
                    AttributeCompression.octEncode(scratchCartesian, scratchCartesian);
                    if (normalAccessorReader.componentType === WebGLConstants.BYTE) {
                        // De-normalize back to signed bytes
                        scratchCartesian.x -= 128;
                        scratchCartesian.y -= 128;
                    }
                }
                Cartesian3.pack(scratchCartesian, scratchCartesianArray);
                normalAccessorReader.write(scratchCartesianArray);
                doneIndicesByAccessor[normalAccessorId][index] = true;
            }
            if (defined(indexAccessorReader)) {
                if (!indexAccessorReader.pastEnd()) {
                    indexAccessorReader.next();
                    indexAccessorReader.read(scratchIndexArray);
                    index = scratchIndexArray[0];
                } else {
                    keepReading = false;
                }
            } else if (!positionAccessorReader.pastEnd() && !normalAccessorReader.pastEnd()) {
                index++;
            } else {
                keepReading = false;
            }
        }
    }
}

/**
 * Returns primitives mapped to mode mapped to material.
 *
 * @param {Object[]} primitives An array containing the primitives to sort.
 * @returns {Object} An object mapping material ids to mode to an array of primitives.
 */
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

/**
 * Return primitives that share attribute accessors with a given primitive.
 *
 * @param {Object[]} primitives An array of primitive objects to compare the primitive against.
 * @param {Object} primitive The primitive to compare for conflicts.
 * @returns {Number[]} An array containing indices of primitives that have attribute accessor conflicts.
 */
function getPrimitiveConflicts(primitives, primitive) {
    var primitivesLength = primitives.length;
    var conflicts = [];
    for (var i = 0; i < primitivesLength; i++) {
        var otherPrimitive = primitives[i];
        if (primitive !== otherPrimitive && primitivesShareAttributeAccessor(primitive, otherPrimitive)) {
            conflicts.push(i);
        }
    }
    return conflicts;
}

/**
 * Return all the primitives in the meshes of the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object[]} An array containing all the primitives.
 */
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

/**
 * Compare two primitives to check if they are equal.
 *
 * @param {Object} primitiveOne The first primitive to compare.
 * @param {Object} primitiveTwo The second primitive to compare.
 * @returns {Boolean} True if primitives are the same, false otherwise.
 */
function primitiveEquals(primitiveOne, primitiveTwo) {
    return primitiveOne.mode === primitiveTwo.mode &&
            primitiveOne.material === primitiveTwo.material &&
            primitiveOne.indices === primitiveTwo.indices &&
            deepEqual(primitiveOne.attributes, primitiveTwo.attributes);
}
