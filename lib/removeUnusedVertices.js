/*jshint loopfunc: true */
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
            var usageLength = usage.length;
            var indexAccessorIds = table.indexAccessors;
            var attributeAccessorIds = table.attributeAccessors;
            var removed = 0;
            var chunk;
            for (var j = 0; j < usageLength; j++) {
                if (!usage[j] && !defined(chunk)) {
                    chunk = j;
                } else if (usage[j] && defined(chunk)) {
                    var amount = j - chunk;
                    for (var indexAccessorId in indexAccessorIds) {
                        if (indexAccessorIds.hasOwnProperty(indexAccessorId)) {
                            decrementIndicesPastIndex(gltf, accessors[indexAccessorId], j - removed - 1, amount);
                        }
                    }
                    for (attributeAccessorId in attributeAccessorIds) {
                        if (attributeAccessorIds.hasOwnProperty(attributeAccessorId)) {
                            removeAttributeValuesInRange(gltf, accessors[attributeAccessorId], chunk - removed, j - removed - 1);
                        }
                    }
                    removed += amount;
                    chunk = undefined;
                }
            }
            // Remove the end chunk
            for (attributeAccessorId in attributeAccessorIds) {
                if (attributeAccessorIds.hasOwnProperty(attributeAccessorId)) {
                    var accessor = accessors[attributeAccessorId];
                    var count = accessor.count;
                    var diff = -1;
                    if (defined(chunk)) {
                        diff = count + removed - chunk;
                    } else if (count + removed > usage.length) {
                        diff = count + removed - usage.length;
                    }
                    if (diff > 0) {
                        accessor.count -= diff;
                    }
                }
            }
            chunk = undefined;
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

function removeAttributeValuesInRange(gltf, attributeAccessor, startIndex, stopIndex) {
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
    for (var j = stopIndex; j < accessor.count - 1; j++) {
        source.copy(source, byteOffset, copyOffset, copyOffset + componentByteLength);
        copyOffset += byteStride;
        byteOffset += byteStride;
    }
    accessor.count -= range;
}