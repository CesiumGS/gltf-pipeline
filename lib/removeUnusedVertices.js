'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

var AccessorReader = require('./AccessorReader');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var createAccessorUsageTables = require('./createAccessorUsageTables');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');

module.exports = removeUnusedVertices;

/**
 * Removes attributes from indexed primitives in the glTF asset that are not used.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset without unused vertices.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 * @see uninterleaveAndPackBuffers
 */
function removeUnusedVertices(gltf) {
    if (defined(gltf.accessors) && defined(gltf.buffers) && defined(gltf.bufferViews) && defined(gltf.meshes)) {
        removeUnusedVerticesFromAccessors(gltf);
        uninterleaveAndPackBuffers(gltf);
    }
    return gltf;
}

function removeUnusedVerticesFromAccessors(gltf) {
    var accessors = gltf.accessors;
    var attributeAccessorId;
    var accessorUsageTables = createAccessorUsageTables(gltf);
    var numTables = accessorUsageTables.length;
    for (var i = 0; i < numTables; i++) {
        var table = accessorUsageTables[i];
        if (defined(table)) {
            var usage = table.usage;
            var indexAccessorIds = table.indexAccessors;
            var attributeAccessorIds = table.attributeAccessors;
            var attributeAccessorIdsArray = Object.keys(attributeAccessorIds);
            var removed = 0;
            var count;
            if (attributeAccessorIdsArray.length > 0) {
                count = accessors[attributeAccessorIdsArray[0]].count;
                var removedStart = -1;
                for (var j = 0; j < count; j++) {
                    if (defined(usage[j]) && usage[j]) {
                        if (removed > 0) {
                            // copy this attribute back
                            for (attributeAccessorId in attributeAccessorIds) {
                                if (attributeAccessorIds.hasOwnProperty(attributeAccessorId)) {
                                    accessorWriteFromTo(gltf, accessors[attributeAccessorId], j, j - removed);
                                }
                            }
                            if (removedStart >= 0) {
                                // decrement indices
                                for (var indexAccessorId in indexAccessorIds) {
                                    if (indexAccessorIds.hasOwnProperty(indexAccessorId)) {
                                        decrementIndicesPastIndex(gltf, accessors[indexAccessorId], j - removed - 1, j - removedStart);
                                    }
                                }
                                removedStart = -1;
                            }
                        }
                    } else {
                        if (removedStart < 0) {
                            removedStart = j;
                        }
                        removed++;
                    }
                }
                for (attributeAccessorId in attributeAccessorIds) {
                    if (attributeAccessorIds.hasOwnProperty(attributeAccessorId)) {
                        var attributeAccessor = accessors[attributeAccessorId];
                        attributeAccessor.count -= removed;
                    }
                }
            }
        }
    }
}

function accessorWriteFromTo(gltf, accessor, fromIndex, toIndex) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;

    var bufferViewId = accessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];

    var source = buffer.extras._pipeline.source;
    var byteOffset = bufferView.byteOffset + accessor.byteOffset;

    var byteStride = getAccessorByteStride(accessor);
    var componentByteLength = byteLengthForComponentType(accessor.componentType);
    var numberOfComponents = numberOfComponentsForType(accessor.type);

    for (var i = 0; i < numberOfComponents; i++) {
        for (var j = 0; j < componentByteLength; j++) {
            source[byteOffset + byteStride * toIndex + i * componentByteLength + j] =
                source[byteOffset + byteStride * fromIndex + i * componentByteLength + j];
        }
    }
}

function decrementIndicesPastIndex(gltf, indexAccessor, index, amount) {
    var accessorReader = new AccessorReader(gltf, indexAccessor);
    var components = [];
    while(defined(accessorReader.read(components))) {
        var accessedIndex = components[0];
        if (accessedIndex > index) {
            components[0] = accessedIndex - amount;
            accessorReader.write(components);
        }
        accessorReader.next();
    }
}
