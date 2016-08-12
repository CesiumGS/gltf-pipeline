'use strict';
var Cesium = require('cesium');
var deepEqual = require('deep-equal');

var ComponentDatatype = Cesium.ComponentDatatype;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;

var PrimitiveHelpers = require('./PrimitiveHelpers');
var findAccessorMinMax = require('./findAccessorMinMax');
var getUniqueId = require('./getUniqueId');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readAccessor = require('./readAccessor');

module.exports = combinePrimitives;

function combinePrimitives(gltf) {
    PrimitiveHelpers.markPrimitiveConflicts(gltf, PrimitiveHelpers.getAllPrimitives(gltf));
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitivesByMaterialMode = PrimitiveHelpers.getPrimitivesByMaterialMode(mesh.primitives);
            mesh.primitives = [];
            for (var materialId in primitivesByMaterialMode) {
                if (primitivesByMaterialMode.hasOwnProperty(materialId)) {
                    var primitivesByMode = primitivesByMaterialMode[materialId];
                    for (var mode in primitivesByMode) {
                        if (primitivesByMode.hasOwnProperty(mode)) {
                            var primitives = primitivesByMode[mode];
                            primitives = combinePrimitivesInGroup(gltf, primitives, materialId, parseInt(mode), false);
                            var primitivesLength = primitives.length;
                            for (var i = 0; i < primitivesLength; i++) {
                                mesh.primitives.push(primitives[i]);
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Combines all of the provided primitives if possible.
 * If primitives have no shared data with the other primitives, their attributes and indices will be concatenated together and
 * the indices will be incremented by the attribute offset. If the primitives have the same attribute accessors but different index
 * accessors, the index accessors will be concatenated. In all other cases, the primitives will be left alone.
 *
 * @param gltf
 * @param primitives
 * @returns {*}
 */
function combinePrimitivesInGroup(gltf, primitives, materialId, mode, uint32Enabled) {
    uint32Enabled = defaultValue(uint32Enabled, false);
    var accessors = gltf.accessors;
    var primitivesLength = primitives.length;
    if (primitivesLength > 1) {
        var accessor;
        var i, j;
        var mergeIndicesPrimitiveGroups = [];
        var mergeIndicesPrimitiveGroupsLength;
        var mergeIndicesGroup;
        var mergeIndicesGroupLength;
        var rootPrimitive;
        var primitive;
        var concatenatePrimitives = [];
        var preservePrimitives = [];
        var attributes = {};
        var attributeTypes = {};
        var indices = [];

        var rootPrimitiveAttributes = primitives[0].attributes;
        var semantics = Object.keys(rootPrimitiveAttributes);
        var semantic;
        var semanticsLength = semantics.length;
        for (i = 0; i < semanticsLength; i++) {
            semantic = semantics[i];
            accessor = accessors[rootPrimitiveAttributes[semantic]];
            attributes[semantic] = [];
            attributeTypes[semantic] = {
                type : accessor.type,
                componentType : accessor.componentType
            };
        }

        // Sort primitives into the three combine cases
        for (i = 0; i < primitivesLength; i++) {
            primitive = primitives[i];
            // If the primitive's attribute accessors are different lengths, there is no reasonable strategy for combining
            var attributeLength = -1;
            var canResolve = true;
            for (j = 0; j < semanticsLength; j++) {
                var compareAttributeLength = accessors[primitive.attributes[semantics[j]]].count;
                if (attributeLength < 0) {
                    attributeLength = compareAttributeLength;
                } else if (attributeLength !== compareAttributeLength) {
                    preservePrimitives.push(primitive);
                    canResolve = false;
                    break;
                }
            }
            if (!canResolve) {
                continue;
            }
            var conflicts = primitive.extras._pipeline.conflicts;
            var conflictsLength = conflicts.length;
            canResolve = true;
            for (j = 0; j < conflictsLength; j++) {
                var conflictPrimitive = conflicts[j];
                // If this primitive has conflicts, we can only merge it if all of them are in this merge group
                if (primitives.indexOf(conflictPrimitive) < 0) {
                    canResolve = false;
                    break;
                }
            }
            if (!canResolve) {
                // The primitive has conflicts outside of this group, it cannot be combined.
                preservePrimitives.push(primitive);
            } else if (conflictsLength > 0) {
                // The primitive has conflicts but they are all in this group, try to add it to an existing mergeIndicesGroup
                mergeIndicesPrimitiveGroupsLength = mergeIndicesPrimitiveGroups.length;
                var matched = false;
                for (j = 0; j < mergeIndicesPrimitiveGroupsLength; j++) {
                    mergeIndicesGroup = mergeIndicesPrimitiveGroups[j];
                    rootPrimitive = mergeIndicesGroup[0];
                    if (deepEqual(primitive.attributes, rootPrimitive.attributes)) {
                        mergeIndicesGroup.push(primitive);
                        matched = true;
                        break;
                    }
                }
                // No existing matches, make a new group
                if (!matched) {
                    mergeIndicesPrimitiveGroups.push([primitive]);
                }
            } else {
                // No conflicts, just concatenate
                concatenatePrimitives.push(primitive);
            }
        }

        mergeIndicesPrimitiveGroupsLength = mergeIndicesPrimitiveGroups.length;
        var indexOffset = 0;
        var startIndices;
        var indicesLength;
        for (i = 0; i < mergeIndicesPrimitiveGroupsLength; i++) {
            startIndices = indices.length;
            mergeIndicesGroup = mergeIndicesPrimitiveGroups[i];
            mergeIndicesGroupLength = mergeIndicesGroup.length;
            rootPrimitive = mergeIndicesGroup[0];

            for (j = 0; j < semanticsLength; j++) {
                semantic = semantics[j];
                accessor = accessors[rootPrimitive.attributes[semantic]];
                readAccessor(gltf, accessor, attributes[semantic], false);
            }
            for (j = 0; j < mergeIndicesGroupLength; j++) {
                primitive = mergeIndicesGroup[j];
                readAccessor(gltf, accessors[primitive.indices], indices, false);
            }
            if (indexOffset > 0) {
                indicesLength = indices.length;
                for (j = startIndices; j < indicesLength; j++) {
                    indices[j] += indexOffset;
                }
            }
            indexOffset += accessor.count;
        }
        var concatenatePrimitivesLength = concatenatePrimitives.length;
        for (i = 0; i < concatenatePrimitivesLength; i++) {
            primitive = concatenatePrimitives[i];
            startIndices = indices.length;
            for (j = 0; j < semanticsLength; j++) {
                semantic = semantics[j];
                accessor = accessors[primitive.attributes[semantic]];
                readAccessor(gltf, accessor, attributes[semantic], false);
            }
            readAccessor(gltf, accessors[primitive.indices], indices, false);
            if (indexOffset > 0) {
                indicesLength = indices.length;
                for (j = startIndices; j < indicesLength; j++) {
                    indices[j] += indexOffset;
                }
            }
            indexOffset += accessor.count;
        }
        primitives = [];
        if (indices.length > 0) {
            primitives.push(createPrimitive(gltf, attributes, attributeTypes, indices, materialId, mode, uint32Enabled));
        }
        var preservePrimitivesLength = preservePrimitives.length;
        for (i = 0; i < preservePrimitivesLength; i++) {
            primitives.push(preservePrimitives[i]);
        }
    }
    return primitives;
}

function createPrimitive(gltf, attributes, attributeTypes, indices, materialId, mode, uint32Enabled) {
    var primitive = {
        attributes : {},
        indices : createIndicesAccessor(gltf, indices, uint32Enabled),
        material : materialId,
        mode : mode
    };
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
            var attributeTypeData = attributeTypes[semantic];
            primitive.attributes[semantic] = createAttributeAccessor(gltf, attributeTypeData.type, attributeTypeData.componentType, attributes[semantic]);
        }
    }
    return primitive;
}

function createAttributeAccessor(gltf, type, componentType, attributeData) {
    var accessorId = getUniqueId(gltf, 'accessor');
    var bufferViewId = getUniqueId(gltf, 'bufferView');
    var bufferId = getUniqueId(gltf, 'buffer');
    var attributeBuffer = new Buffer(ComponentDatatype.createTypedArray(componentType, attributeData).buffer);

    var accessor = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : componentType,
        count : attributeData.length / numberOfComponentsForType(type),
        extras : {
            _pipeline : {}
        },
        type : type
    };
    gltf.accessors[accessorId] = accessor;
    gltf.bufferViews[bufferViewId] = {
        buffer : bufferId,
        byteLength : attributeBuffer.length,
        byteOffset : 0,
        target : WebGLConstants.ARRAY_BUFFER,
        extras : {
            _pipeline : {}
        }
    };
    gltf.buffers[bufferId] = {
        byteLength : attributeBuffer.length,
        type : 'arraybuffer',
        extras : {
            _pipeline : {
                source : attributeBuffer
            }
        }
    };
    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;
    return accessorId;
}

function createIndicesAccessor(gltf, indices, uint32Enabled) {
    uint32Enabled = defaultValue(uint32Enabled, false);
    var accessorId = getUniqueId(gltf, 'accessor');
    var bufferViewId = getUniqueId(gltf, 'bufferView');
    var bufferId = getUniqueId(gltf, 'buffer');
    var componentType = WebGLConstants.UNSIGNED_SHORT;
    var max = Math.max.apply(null, indices);
    var indicesBuffer;
    if (max > 65535) {
        if (uint32Enabled) {
            componentType = WebGLConstants.UNSIGNED_INT;
            indicesBuffer = new Buffer(new Uint32Array(indices));
        } else {
            throw new DeveloperError('Cannot create an indices accessor with indices greater than 2^16-1 without uint32 indices support.');
        }
    } else {
        indicesBuffer = new Buffer(new Uint16Array(indices).buffer);
    }
    var min = Math.min.apply(null, indices);
    gltf.accessors[accessorId] = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : componentType,
        count : indices.length,
        extras : {
            _pipeline : {}
        },
        max : [max],
        min : [min],
        type : 'SCALAR'
    };
    gltf.bufferViews[bufferViewId] = {
        buffer : bufferId,
        byteLength : indicesBuffer.length,
        byteOffset : 0,
        target : WebGLConstants.ELEMENT_ARRAY_BUFFER,
        extras : {
            _pipeline : {}
        }
    };
    gltf.buffers[bufferId] = {
        byteLength : indicesBuffer.length,
        type : 'arraybuffer',
        extras : {
            _pipeline : {
                source : indicesBuffer
            }
        }
    };
    return accessorId;
}