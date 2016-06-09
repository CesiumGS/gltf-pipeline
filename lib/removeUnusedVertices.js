/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;
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
    var doneIndexAccessors = {};
    var i;
    for (var accessorId in usedIndicesForAccessor) {
        if (usedIndicesForAccessor.hasOwnProperty(accessorId)) {
            var usedIndices = usedIndicesForAccessor[accessorId];
            var indexAccessors = usedIndices.indexAccessors;
            var indexAccessorsLength = indexAccessors.length;
            var usedIndexValues = usedIndices.values;
            var usedIndexValuesLength = usedIndexValues.length;
            var removed = 0;
            for (i = 0; i < usedIndexValuesLength; i++) {
                if (!usedIndexValues[i]) {
                    removeAttributeValueAtIndex(gltf, accessors[accessorId], i - removed, usedIndexValuesLength - removed);
                    removed++;
                    for (var j = 0; j < indexAccessorsLength; j++) {
                        var indexAccessor = indexAccessors[j];
                        if (!defined(doneIndexAccessors[indexAccessor])) {
                            decrementIndicesPastIndex(gltf, accessors[indexAccessor], i - removed);
                        }
                    }
                }
            }
            for (i = 0; i < indexAccessorsLength; i++) {
                doneIndexAccessors[indexAccessor] = true;
            }
        }
    }
}

function getUsedIndicesForAccessors(gltf) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var meshes = gltf.meshes;
    var doneIndexAccessors = {};
    var accessorsUsedIndices = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var indexAccessorId = primitive.indices;
                if (defined(indexAccessorId) && !defined(doneIndexAccessors[indexAccessorId])) {
                    var indexAccessor = accessors[indexAccessorId];
                    var numIndices = indexAccessor.count;
                    var indexBufferViewId = indexAccessor.bufferView;
                    var indexBufferView = bufferViews[indexBufferViewId];
                    var indexBufferId = indexBufferView.buffer;
                    var indexBuffer = buffers[indexBufferId];
                    var source = indexBuffer.extras._pipeline.source;
                    var byteStride = getAccessorByteStride(indexAccessor);
                    var attributes = primitive.attributes;
                    for (var attribute in attributes) {
                        if (attributes.hasOwnProperty(attribute)) {
                            var byteOffset = indexBufferView.byteOffset + indexAccessor.byteOffset;
                            var accessorId = attributes[attribute];
                            var usedIndices = accessorsUsedIndices[accessorId];
                            var accessor = accessors[accessorId];
                            if (!defined(usedIndices)) {
                                var usedIndices = {};
                                usedIndices.values = new Array(accessor.count).fill(false);
                                usedIndices.indexAccessors = [];
                                accessorsUsedIndices[accessorId]= usedIndices;
                            }
                            usedIndices.indexAccessors.push(indexAccessorId);
                            for (var j = 0; j < numIndices; j++) {
                                var index = readBufferComponentType(source, indexAccessor.componentType, byteOffset);
                                usedIndices.values[index] = true;
                                byteOffset += byteStride;
                            }
                        }
                    }
                    doneIndexAccessors[indexAccessorId] = true;
                }
            }
        }
    }
    return accessorsUsedIndices;
}

function decrementIndicesPastIndex(gltf, indexAccessor, index) {
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
            writeBufferComponentType(source, componentType, accessedIndex - 1, byteOffset);
        }
        byteOffset += byteStride;
    }
}

function removeAttributeValueAtIndex(gltf, attributeAccessor, index, count) {
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
    byteOffset += byteStride * index;
    var componentByteLength = byteLengthForComponentType(accessor.componentType) * numberOfComponentsForType(accessor.type);
    // Shift the data past the deleted index back by one
    for (var j = index; j < count-1; j++) {
        var copyOffset = byteOffset + byteStride;
        for (var k = 0; k < componentByteLength; k++) {
            source[byteOffset + k] = source[copyOffset + k];
        }
        byteOffset = copyOffset;
    }
    accessor.count--;
}