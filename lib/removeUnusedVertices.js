/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var readBufferComponentType = require('./readBufferComponentType');
var writeBufferComponentType = require('./writeBufferComponentType');

module.exports = removeUnusedVertices;

//Removes attributes from indexed primitives that aren't used
function removeUnusedVertices(gltf) {
    if (defined(gltf.accessors) && defined(gltf.buffers) && defined(gltf.bufferViews) && defined(gltf.meshes)) {
        removeUnusedVerticesFromAccessors(gltf);
        uninterleaveAndPackBuffers(gltf);
    }
    return gltf;
}

function removeUnusedVerticesFromAccessors(gltf) {
    var accessors = gltf.accessors;
    var usedIndicesForAccessor = getUsedIndicesForAccessors(gltf);
    combinePrimitiveAttributeUsedIndices(gltf, usedIndicesForAccessor);
    var indexAccessorId;
    var doneIndexAccessors = {};
    var i;
    var amount;
    for (var accessorId in usedIndicesForAccessor) {
        if (usedIndicesForAccessor.hasOwnProperty(accessorId)) {
            var accessor = accessors[accessorId];
            var usedIndices = usedIndicesForAccessor[accessorId];
            var indexAccessors = usedIndices.indexAccessors;
            var usedIndexValues = usedIndices.values;
            var usedIndexValuesLength = usedIndexValues.length;
            var removed = 0;
            var chunk;
            for (i = 0; i < usedIndexValuesLength; i++) {
                if (!usedIndexValues[i] && !defined(chunk)) {
                    chunk = i;
                } else if (usedIndexValues[i] && defined(chunk)) {
                    amount = i - chunk;
                    removeAttributeValuesInRange(gltf, accessor, chunk - removed, i - removed - 1, usedIndexValuesLength - removed);
                    for (indexAccessorId in indexAccessors) {
                        if (indexAccessors.hasOwnProperty(indexAccessorId)) {
                            if (!defined(doneIndexAccessors[indexAccessorId])) {
                                decrementIndicesPastIndex(gltf, accessors[indexAccessorId], i - removed - 1, amount);
                            }
                        }
                    }
                    removed += amount;
                    chunk = undefined;
                }
            }
            // Remove the end chunk
            if (defined(chunk)) {
                amount = usedIndexValuesLength - chunk;
                accessor.count -= amount;
                chunk = undefined;
            }
            for (indexAccessorId in indexAccessors) {
                if (indexAccessors.hasOwnProperty(indexAccessorId)) {
                    doneIndexAccessors[indexAccessorId] = true;
                }
            }
        }
    }
}

function combinePrimitiveAttributeUsedIndices(gltf, accessorUsedIndices) {
    var meshes = gltf.meshes;
    var attribute;
    var accessorId;
    var usedIndices;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                if (defined(primitive.indices)) {
                    var attributes = primitive.attributes;
                    var values = [];
                    var indexAccessors = {};
                    for (attribute in attributes) {
                        if (attributes.hasOwnProperty(attribute)) {
                            accessorId = attributes[attribute];
                            usedIndices = accessorUsedIndices[accessorId];
                            var usedIndexValues = usedIndices.values;
                            var usedIndexValuesLength = usedIndexValues.length;
                            if (usedIndexValuesLength > values.length) {
                                values.length = usedIndexValuesLength;
                            }
                            var usedIndexAccessors = usedIndices.indexAccessors;
                            for (var usedIndexAccessorId in usedIndexAccessors) {
                                if (usedIndexAccessors.hasOwnProperty(usedIndexAccessorId)) {
                                    indexAccessors[usedIndexAccessorId] = true;
                                }
                            }
                            for (var j = 0; j < usedIndexValuesLength; j++) {
                                var value = values[j];
                                if (defined(value)) {
                                    values[j] = value || usedIndexValues[j];
                                } else {
                                    values[j] = usedIndexValues[j];
                                }
                            }
                        }
                    }
                    for (attribute in attributes) {
                        if (attributes.hasOwnProperty(attribute)) {
                            accessorId = attributes[attribute];
                            usedIndices = accessorUsedIndices[accessorId];
                            usedIndices.values = values;
                            usedIndices.indexAccessors = indexAccessors;
                        }
                    }
                    indexAccessors = undefined;
                }
            }
        }
    }
}

function getUsedIndicesForAccessors(gltf) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var meshes = gltf.meshes;
    var accessorsUsedIndices = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var indexAccessorId = primitive.indices;
                if (defined(indexAccessorId)) {
                    var indexAccessor = accessors[indexAccessorId];
                    var numIndices = indexAccessor.count;
                    var indexBufferViewId = indexAccessor.bufferView;
                    var indexBufferView = bufferViews[indexBufferViewId];
                    var indexBufferId = indexBufferView.buffer;
                    var indexBuffer = buffers[indexBufferId];
                    var source = indexBuffer.extras._pipeline.source;
                    var byteStride = getAccessorByteStride(indexAccessor);
                    var attributes = primitive.attributes;
                    var byteOffset = indexBufferView.byteOffset + indexAccessor.byteOffset;
                    for (var j = 0; j < numIndices; j++) {
                        var index = readBufferComponentType(source, indexAccessor.componentType, byteOffset);
                        for (var attribute in attributes) {
                            if (attributes.hasOwnProperty(attribute)) {
                                var accessorId = attributes[attribute];
                                var usedIndices = accessorsUsedIndices[accessorId];
                                var accessor = accessors[accessorId];
                                if (!defined(usedIndices)) {
                                    usedIndices = {};
                                    usedIndices.values = new Array(accessor.count).fill(false);
                                    var usedIndexAccessors = {};
                                    usedIndexAccessors[indexAccessorId] = true;
                                    usedIndices.indexAccessors = usedIndexAccessors;
                                    accessorsUsedIndices[accessorId] = usedIndices;
                                }
                                if (j === 0) {
                                    usedIndices.indexAccessors[indexAccessorId] = true;
                                }
                                usedIndices.values[index] = true;
                            }
                        }
                        byteOffset += byteStride;
                    }
                }
            }
        }
    }
    return accessorsUsedIndices;
}

function decrementIndicesPastIndex(gltf, indexAccessor, index, amount) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var bufferViewId = indexAccessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];
    var source = buffer.extras._pipeline.source;
    var numIndices = indexAccessor.count;
    var byteOffset = bufferView.byteOffset + indexAccessor.byteOffset;
    var byteStride = getAccessorByteStride(indexAccessor);
    var i;
    for (i = 0; i < numIndices; i++) {
        var componentType = indexAccessor.componentType;
        var accessedIndex = readBufferComponentType(source, componentType, byteOffset);
        if (accessedIndex > index) {
            writeBufferComponentType(source, componentType, accessedIndex - amount, byteOffset);
        }
        byteOffset += byteStride;
    }
}

function removeAttributeValuesInRange(gltf, attributeAccessor, startIndex, stopIndex, count) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    // Adjust the attribute accessor data
    var accessor = attributeAccessor;
    var bufferViewId = accessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];
    var source = buffer.extras._pipeline.source;
    var byteOffset = bufferView.byteOffset + accessor.byteOffset;
    var byteStride = getAccessorByteStride(accessor);
    var componentByteLength = byteLengthForComponentType(accessor.componentType) * numberOfComponentsForType(accessor.type);
    var range = stopIndex - startIndex + 1;
    // Shift the data past the deleted index back by the range
    var copyOffset = byteOffset + byteStride * (stopIndex + 1);
    byteOffset += byteStride * startIndex;
    for (var j = stopIndex; j < count - 1; j++) {
        source.copy(source, byteOffset, copyOffset, copyOffset + componentByteLength);
        copyOffset += byteStride;
        byteOffset += byteStride;
    }
    accessor.count -= range;
}