'use strict';
var Cesium = require('cesium');
var hashObject = require('object-hash');
var addBuffer = require('./addBuffer');
var addToArray = require('./addToArray');
var findAccessorMinMax = require('./findAccessorMinMax');
var ForEach = require('./ForEach');
var readAccessorPacked = require('./readAccessorPacked');
var removeUnusedElements = require('./removeUnusedElements');

var clone = Cesium.clone;
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var numberOfComponentsForType = Cesium.numberOfComponentsForType;

module.exports = splitPrimitives;

/**
 * Splits primitives that reference different indices within the same mesh.
 * This stage is used internally by compressDracoMeshes.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} glTF with primitives split.
 *
 * @private
 */
function splitPrimitives(gltf) {
    var i;
    var hash;
    var primitives;
    var primitivesLength;

    var hashPrimitives = {};
    var duplicatePrimitives = {};
    var primitivesWithSharedAttributes = {};
    var primitivesSplit = false;

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            var hashPrimitive = hashObject({
                indices: primitive.indices,
                attributes: primitive.attributes,
                targets: primitive.targets,
                mode: primitive.mode
            });
            if (defined(hashPrimitives[hashPrimitive])) {
                var duplicates = defaultValue(duplicatePrimitives[hashPrimitive], []);
                duplicatePrimitives[hashPrimitive] = duplicates;
                duplicates.push(primitive);
                return;
            }
            hashPrimitives[hashPrimitive] = primitive;

            var hashAttributes = hashObject({
                attributes: primitive.attributes,
                targets: primitive.targets,
                mode: primitive.mode
            });
            var primitivesShared = defaultValue(primitivesWithSharedAttributes[hashAttributes], []);
            primitivesWithSharedAttributes[hashAttributes] = primitivesShared;
            primitivesShared.push(primitive);
        });
    });

    for (hash in primitivesWithSharedAttributes) {
        if (primitivesWithSharedAttributes.hasOwnProperty(hash)) {
            primitives = primitivesWithSharedAttributes[hash];
            primitivesLength = primitives.length;
            if (primitivesLength === 1) {
                continue;
            }
            primitivesSplit = true;
            var attributeData = readAttributes(gltf, primitives[0]);
            var targetData = readTargets(gltf, primitives[0]);
            for (i = 0; i < primitivesLength; ++i) {
                splitPrimitive(gltf, primitives[i], attributeData, targetData);
            }
        }
    }

    if (primitivesSplit) {
        for (hash in duplicatePrimitives) {
            if (duplicatePrimitives.hasOwnProperty(hash)) {
                var primitiveToCopy = hashPrimitives[hash];
                primitives = duplicatePrimitives[hash];
                primitivesLength = primitives.length;
                for (i = 0; i < primitivesLength; ++i) {
                    copyPrimitive(primitiveToCopy, primitives[i]);
                }
            }
        }
        removeUnusedElements(gltf);
    }

    return gltf;
}

function copyPrimitive(primitiveToCopy, primitive) {
    primitive.indices = primitiveToCopy.indices;
    ForEach.meshPrimitiveAttribute(primitiveToCopy, function(accessorId, semantic) {
        primitive.attributes[semantic] = accessorId;
    });
    ForEach.meshPrimitiveTarget(primitiveToCopy, function(target, targetIndex) {
        ForEach.meshPrimitiveTargetAttribute(target, function(accessorId, semantic) {
            primitive.targets[targetIndex][semantic] = accessorId;
        });
    });
}

function splitPrimitive(gltf, primitive, attributeData, targetData) {
    var indicesAccessor = gltf.accessors[primitive.indices];
    var indices = readAccessorPacked(gltf, indicesAccessor);
    var mappedIndices = {};
    var newIndices = [];
    var uniqueIndicesLength = 0;
    var indicesLength = indices.length;
    for (var i = 0; i < indicesLength; ++i) {
        var index = indices[i];
        var mappedIndex = mappedIndices[index];
        if (!defined(mappedIndex)) {
            mappedIndex = uniqueIndicesLength++;
            mappedIndices[index] = mappedIndex;
        }
        newIndices.push(mappedIndex);
    }
    primitive.indices = createNewAccessor(gltf, indicesAccessor, newIndices);

    ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
        primitive.attributes[semantic] = createNewAttribute(gltf, accessorId, semantic, attributeData, mappedIndices, uniqueIndicesLength);
    });

    ForEach.meshPrimitiveTarget(primitive, function(target, targetIndex) {
        ForEach.meshPrimitiveTargetAttribute(target, function(accessorId, semantic) {
            target[semantic] = createNewAttribute(gltf, accessorId, semantic, targetData[targetIndex], mappedIndices, uniqueIndicesLength);
        });
    });
}

function createNewAttribute(gltf, accessorId, semantic, attributeData, mappedIndices, uniqueIndicesLength) {
    var accessor = gltf.accessors[accessorId];
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var dataArray = attributeData[semantic];
    var newDataArray = new Array(uniqueIndicesLength * numberOfComponents);
    remapData(dataArray, newDataArray, mappedIndices, numberOfComponents);
    return createNewAccessor(gltf, accessor, newDataArray);
}

function remapData(dataArray, newDataArray, mappedIndices, numberOfComponents) {
    for (var index in mappedIndices) {
        if (mappedIndices.hasOwnProperty(index)) {
            var mappedIndex = mappedIndices[index];
            for (var i = 0; i < numberOfComponents; ++i) {
                newDataArray[mappedIndex * numberOfComponents + i] = dataArray[index * numberOfComponents + i];
            }
        }
    }
}

function createNewAccessor(gltf, oldAccessor, dataArray) {
    var componentType = oldAccessor.componentType;
    var type = oldAccessor.type;
    var numberOfComponents = numberOfComponentsForType(type);
    var count = dataArray.length / numberOfComponents;
    var newBuffer = Buffer.from(ComponentDatatype.createTypedArray(componentType, dataArray).buffer);
    var newBufferViewId = addBuffer(gltf, newBuffer);

    var accessor = clone(oldAccessor, true);
    var accessorId = addToArray(gltf.accessors, accessor);

    accessor.bufferView = newBufferViewId;
    accessor.byteOffset = 0;
    accessor.count = count;

    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;

    return accessorId;
}

function readAttributes(gltf, primitive) {
    var attributeData = {};
    ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
        attributeData[semantic] = readAccessorPacked(gltf, gltf.accessors[accessorId]);
    });
    return attributeData;
}

function readTargets(gltf, primitive) {
    var targetData = [];
    ForEach.meshPrimitiveTarget(primitive, function(target) {
        var attributeData = {};
        targetData.push(attributeData);
        ForEach.meshPrimitiveTargetAttribute(target, function(accessorId, semantic) {
            attributeData[semantic] = readAccessorPacked(gltf, gltf.accessors[accessorId]);
        });
    });
    return targetData;
}
