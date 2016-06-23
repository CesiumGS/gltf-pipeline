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

function growUsageTable(usageTable, length) {
    var powerOf2 = Math.pow(2, Math.ceil(Math.log(length) / Math.log(2)));
    var diff = powerOf2 - usageTable.length;
    if (diff > 0) {
        usageTable = usageTable.concat(new Array(diff).fill(false));
    }
    return usageTable;
}

function mergeUsageTables(tables, accessorTableMapping, indexA, indexB) {
    var tableA = tables[indexA];
    var tableAUsage = tableA.usage;
    var tableB = tables[indexB];
    var tableBIndexAccessors = tableB.indexAccessors;
    var tableBAttributeAccessors = tableB.attributeAccessors;
    var tableBUsage = tableB.usage;
    for (var indexAccessorId in tableBIndexAccessors) {
        if (tableBIndexAccessors.hasOwnProperty(indexAccessorId)) {
            tableA.indexAccessors[indexAccessorId] = true;
            accessorTableMapping[indexAccessorId] = indexA;
        }
    }
    for (var attributeAccessorId in tableBAttributeAccessors) {
        if (tableBAttributeAccessors.hasOwnProperty(attributeAccessorId)) {
            tableA.attributeAccessors[attributeAccessorId] = true;
            accessorTableMapping[attributeAccessorId] = indexA;
        }
    }
    var tableBUsageLength = tableBUsage.length;
    if (tableBUsageLength > tableAUsage.length) {
        tableA.usage = growUsageTable(tableAUsage, tableBUsageLength);
    }
    for (var i = 0; i < tableBUsageLength; i++) {
        if (tableBUsage[i]) {
            tableA.usage[i] = true;
        }
    }
    tables[indexB] = undefined;
}

function markUsageForIndexAccessor(gltf, accessor, usage) {
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var bufferViewId = accessor.bufferView;
    var bufferView = bufferViews[bufferViewId];
    var bufferId = bufferView.buffer;
    var buffer = buffers[bufferId];
    var source = buffer.extras._pipeline.source;
    var byteOffset = accessor.byteOffset + bufferView.byteOffset;
    var byteStride = getAccessorByteStride(accessor);
    for (var i = 0; i < accessor.count; i++) {
        var index = readBufferComponentType(source, accessor.componentType, byteOffset + i * byteStride);
        if (index > usage.length) {
            usage = growUsageTable(usage, index);
        }
        usage[index] = true;
    }
    return usage;
}

function createAccessorUsageTables(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var tables = [];
    var accessorTableMapping = {};
    var attribute;
    var attributeAccessorId;
    var table;
    var tableIndex;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength ; i++) {
                var primitive = primitives[i];
                var attributes = primitive.attributes;
                var indexAccessorId = primitive.indices;
                if (defined(indexAccessorId)) {
                    var indexAccessor = accessors[indexAccessorId];
                    tableIndex = accessorTableMapping[indexAccessorId];
                    if (!defined(tableIndex)) {
                        // There is no mapping for this index accessor, check if there is an existing mapping for any of the attributes
                        var mappedTableIndex;
                        var mappedTableIndices = {};
                        for (attribute in attributes) {
                            if (attributes.hasOwnProperty(attribute)) {
                                attributeAccessorId = attributes[attribute];
                                if (defined(accessorTableMapping[attributeAccessorId])) {
                                    // There is already a mapping for one of the attributes, join that one
                                    mappedTableIndices[accessorTableMapping[attributeAccessorId]] = true;
                                }
                            }
                        }
                        var mappedTableIndexArray = Object.keys(mappedTableIndices);
                        var mappedTableIndexArrayLength = mappedTableIndexArray.length;
                        if (mappedTableIndexArrayLength > 0) {
                            mappedTableIndex = parseInt(mappedTableIndexArray[0]);
                            for (var j = 1; j < mappedTableIndexArrayLength; j++) {
                                // Multiple attributes mapped to different tables, merge them
                                var indexB = mappedTableIndexArray[j];
                                mergeUsageTables(tables, accessorTableMapping, mappedTableIndex, indexB);
                            }
                        }
                        if (!defined(mappedTableIndex)) {
                            // There are no existing linkages to other accessors, make a new table entry
                            table = {
                                indexAccessors : {},
                                attributeAccessors : {},
                                usage : []
                            };
                            tables.push(table);
                            mappedTableIndex = tables.length - 1;
                        } else {
                            // Join an existing mapping
                            table = tables[mappedTableIndex];
                        }
                        table.usage = markUsageForIndexAccessor(gltf, indexAccessor, table.usage);
                        table.indexAccessors[indexAccessorId] = true;
                        for (attribute in attributes) {
                            if (attributes.hasOwnProperty(attribute)) {
                                attributeAccessorId = attributes[attribute];
                                table.attributeAccessors[attributeAccessorId] = true;
                                accessorTableMapping[attributeAccessorId] = mappedTableIndex;
                            }
                        }
                        accessorTableMapping[indexAccessorId] = mappedTableIndex;
                        mappedTableIndex = undefined;
                    } else {
                        // This index accessor has already been done
                        table = tables[tableIndex];
                        for (attribute in attributes) {
                            if (attributes.hasOwnProperty(attribute)) {
                                attributeAccessorId = attributes[attribute];
                                // Make sure the attribute accessors haven't been assigned somewhere else
                                var attributeTableIndex = accessorTableMapping[attributeAccessorId];
                                if (defined(attributeTableIndex) && attributeTableIndex !== tableIndex) {
                                    // Merge them into this one if they have been
                                    mergeUsageTables(tables, accessorTableMapping, tableIndex, attributeTableIndex);
                                }
                                table.attributeAccessors[attributeAccessorId] = true;
                                accessorTableMapping[attributeAccessorId] = tableIndex;
                            }
                        }
                    }
                }
            }
        }
    }
    return tables;
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