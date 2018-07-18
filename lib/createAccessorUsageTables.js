'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var getAccessorByteStride = require('./getAccessorByteStride');
var readBufferComponent = require('./readBufferComponent');

module.exports = createAccessorUsageTables;

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
            tableA.attributeAccessors[attributeAccessorId] = tableBAttributeAccessors[attributeAccessorId];
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
        var index = readBufferComponent(source, accessor.componentType, byteOffset + i * byteStride);
        if (index > usage.length) {
            usage = growUsageTable(usage, index);
        }
        usage[index] = true;
    }
    return usage;
}

/**
 * @private
 */
function createAccessorUsageTables(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var tables = [];
    var accessorTableMapping = {};
    var attribute;
    var attributeAccessorId;
    var table;
    var tableIndex;
    var i;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (i = 0; i < primitivesLength ; i++) {
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
    var finalTables = [];
    var tablesLength = tables.length;
    for (i = 0; i < tablesLength; i++) {
        table = tables[i];
        if (defined(table)) {
            finalTables.push(table);
        }
    }
    return finalTables;
}
