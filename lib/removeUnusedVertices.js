/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');

module.exports = removeUnusedVertices;

//Removes attributes from indexed primitives that aren't used
function removeUnusedVertices(gltf) {
    if (defined(gltf.accessors) && defined(gltf.buffers) && defined(gltf.bufferViews) && defined(gltf.meshes)) {
        var indexedPrimitives = getIndexedPrimitives(gltf);
        var indexedPrimitivesLength = indexedPrimitives.length;
        for (var i = 0; i < indexedPrimitivesLength; i++) {
            removeUnusedVerticesFromPrimitive(gltf, indexedPrimitives[i]);
        }
        uninterleaveAndPackBuffers(gltf);
    }
    return gltf;
}

function getIndexedPrimitives(gltf) {
    var meshes = gltf.meshes;
    var indexedPrimitives = [];
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                if (defined(primitive.indices)) {
                    indexedPrimitives.push(primitive);
                }
            }
        }
    }
    return indexedPrimitives;
}

function removeUnusedVerticesFromPrimitive(gltf, primitive) {
    var accessors = gltf.accessors;
    var indexAccessorId = primitive.indices;
    var indexAccessor = accessors[indexAccessorId];
    var attributeAccessors = [];
    var attributes = primitive.attributes;
    var count = -1;
    for (var attribute in attributes) {
        var attributeAccessorId = attributes[attribute];
        var attributeAccessor = accessors[attributeAccessorId];
        var accessorCount = attributeAccessor.count;
        if (count < 0) {
            count = accessorCount;
        }
        else if (count != accessorCount){
            // All primitive accessors must have the same number of elements
            // There is an error in this glTF
            return false;
        }
        attributeAccessors.push(attributeAccessor);
    }
    if (count > 0) {
        var usedIndices = getUsedIndices(gltf, indexAccessor, count);
        var deleted = 0;
        for (var i = 0; i < count; i++) {
            if (!usedIndices[i]) {
                removeAttributesAtIndex(gltf, indexAccessor, attributeAccessors, i - deleted, count - deleted);
                deleted++;
            }
        }
    }
    return true;
}

function getUsedIndices(gltf, indexAccessor, attributeCount) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var numIndices = indexAccessor.count;
    var bufferViewId = indexAccessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];
    var source = new Buffer(buffer.extras._pipeline.source);
    var byteOffset = bufferView.byteOffset + indexAccessor.byteOffset;
    var byteStride = getAccessorByteStride(indexAccessor);
    var usedIndices = new Array(attributeCount).fill(false);
    for (var i = 0; i < numIndices; i++) {
        var index = source.readUInt16LE(byteOffset);
        usedIndices[index] = true;
        byteOffset += byteStride;
    }
    return usedIndices;
}

function removeAttributesAtIndex(gltf, indexAccessor, attributeAccessors, index, count) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var attributeAccessorsLength = attributeAccessors.length;
    // All indices past the deleted index should be decremented
    var bufferViewId = indexAccessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];
    var source = new Buffer(buffer.extras._pipeline.source);
    var numIndices = indexAccessor.count;
    var byteOffset = bufferView.byteOffset + indexAccessor.byteOffset;
    var byteStride = getAccessorByteStride(indexAccessor);
    var i;
    for (i = 0; i < numIndices; i++) {
        var accessedIndex = source.readUInt16LE(byteOffset);
        if (accessedIndex > index) {
            numIndices--;
            source.writeUInt16LE(accessedIndex, byteOffset);
        }
        byteOffset += byteStride;
    }
    // Adjust the attribute accessor data
    for (i = 0; i < attributeAccessorsLength; i++) {
        var accessor = attributeAccessors[i];
        bufferViewId = accessor.bufferView;
        bufferView = bufferViews[bufferViewId];
        bufferId = bufferView.buffer;
        buffer = buffers[bufferId];
        source = buffer.extras._pipeline.source;
        byteOffset = bufferView.byteOffset + accessor.byteOffset;
        byteStride = getAccessorByteStride(accessor);
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
}