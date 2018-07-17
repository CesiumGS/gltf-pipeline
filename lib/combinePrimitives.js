'use strict';
var Cesium = require('cesium');
var deepEqual = require('deep-equal');
var PrimitiveHelpers = require('./PrimitiveHelpers');
var createAccessor = require('./createAccessor');
var readAccessor = require('./readAccessor');

var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = combinePrimitives;

/**
 * Combines all of the provided primitives if possible.
 * If primitives have no shared data with the other primitives, their attributes and indices will be concatenated together and
 * the indices will be incremented by the attribute offset. If the primitives have the same attribute accessors but different index
 * accessors, the index accessors will be concatenated. In all other cases, the primitives will be left alone.

 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with combined primitives.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 * @see combineMeshes
 */
function combinePrimitives(gltf) {
    var allPrimitives = PrimitiveHelpers.getAllPrimitives(gltf);
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
                            primitives = combinePrimitivesInGroup(gltf, allPrimitives, primitives, materialId, parseInt(mode), false);
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

function combinePrimitivesInGroup(gltf, allPrimitives, primitives, materialId, mode, uint32Enabled) {
    uint32Enabled = defaultValue(uint32Enabled, false);
    var accessors = gltf.accessors;
    var primitivesLength = primitives.length;
    if (primitivesLength > 1) {
        var accessor;
        var i, j, k;
        var mergeIndicesPrimitiveGroups = [];
        var mergeIndicesPrimitiveGroupsLength;
        var mergeIndicesGroup;
        var mergeIndicesGroupLength;
        var rootPrimitive;
        var primitive;
        var concatenatePrimitiveGroups = [[]];
        var concatenatePrimitiveGroupsLength;
        var preservePrimitives = [];
        var attributes = {};
        var attributeTypes = {};
        var indices = [];
        var accessorCount;

        var rootPrimitiveAttributes = primitives[0].attributes;
        var semantics = Object.keys(rootPrimitiveAttributes);
        var semantic;
        var semanticsLength = semantics.length;
        for (i = 0; i < semanticsLength; i++) {
            semantic = semantics[i];
            accessor = accessors[rootPrimitiveAttributes[semantic]];
            attributes[semantic] = [];
            attributeTypes[semantic] = {
                type: accessor.type,
                componentType: accessor.componentType
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
            var conflicts = PrimitiveHelpers.getPrimitiveConflicts(allPrimitives, primitive);
            var conflictsLength = conflicts.length;
            canResolve = true;
            for (j = 0; j < conflictsLength; j++) {
                var comparePrimitive = allPrimitives[conflicts[j]];
                if (primitives.indexOf(comparePrimitive) < 0) {
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
                concatenatePrimitiveGroups[0].push(primitive);
            }
        }
        primitives = [];

        // merge primitives by combining indices
        mergeIndicesPrimitiveGroupsLength = mergeIndicesPrimitiveGroups.length;
        var indexOffset = 0;
        var startIndices;
        var indicesLength;
        if (mergeIndicesPrimitiveGroupsLength > 0) {
            for (i = 0; i < mergeIndicesPrimitiveGroupsLength; i++) {
                startIndices = indices.length;
                mergeIndicesGroup = mergeIndicesPrimitiveGroups[i];
                mergeIndicesGroupLength = mergeIndicesGroup.length;
                rootPrimitive = mergeIndicesGroup[0];
                if (mergeIndicesGroupLength > 1) {
                    accessorCount = 0;
                    for (j = 0; j < semanticsLength; j++) {
                        semantic = semantics[j];
                        accessor = accessors[rootPrimitive.attributes[semantic]];
                        accessorCount = accessor.count;
                        readAccessor(gltf, accessor, attributes[semantic], false);
                    }
                    for (j = 0; j < mergeIndicesGroupLength; j++) {
                        primitive = mergeIndicesGroup[j];
                        if (defined(primitive.indices)) {
                            readAccessor(gltf, accessors[primitive.indices], indices, false);
                        } else {
                            for (k = 0; k < accessorCount; k++) {
                                indices.push(k);
                            }
                        }
                    }
                    if (indexOffset > 0) {
                        indicesLength = indices.length;
                        for (j = startIndices; j < indicesLength; j++) {
                            indices[j] += indexOffset;
                        }
                    }
                    indexOffset += accessor.count;
                    if (indices.length > 0) {
                        concatenatePrimitiveGroups[0].push(createPrimitive(gltf, attributes, attributeTypes, indices, materialId, mode, uint32Enabled));
                    }
                    // Reset
                    indexOffset = 0;
                    for (j = 0; j < semanticsLength; j++) {
                        semantic = semantics[j];
                        attributes[semantic] = [];
                    }
                    indices = [];
                } else {
                    preservePrimitives.push(rootPrimitive);
                }
            }
        }

        // Subdivide groups for concatenatePrimitives if the combined primitive will overflow the index type (uint16/32)
        var indexMax = uint32Enabled ? 4294967295 : 65535;
        concatenatePrimitiveGroups = subdividePrimitiveGroup(concatenatePrimitiveGroups[0], accessors, indexMax);

        // concatenate primitives by combining attribute buffers and adding offset to indices
        concatenatePrimitiveGroupsLength = concatenatePrimitiveGroups.length;
        for (var h = 0; h < concatenatePrimitiveGroupsLength; h++) {
            var concatenatePrimitives = concatenatePrimitiveGroups[h];
            var concatenatePrimitivesLength = concatenatePrimitives.length;
            if (concatenatePrimitivesLength > 1) {
                // Reset
                indexOffset = 0;
                for (j = 0; j < semanticsLength; j++) {
                    semantic = semantics[j];
                    attributes[semantic] = [];
                }
                indices = [];
                for (i = 0; i < concatenatePrimitivesLength; i++) {
                    primitive = concatenatePrimitives[i];
                    startIndices = indices.length;
                    accessorCount = 0;
                    for (j = 0; j < semanticsLength; j++) {
                        semantic = semantics[j];
                        accessor = accessors[primitive.attributes[semantic]];
                        accessorCount = accessor.count;
                        readAccessor(gltf, accessor, attributes[semantic], false);
                    }
                    if (defined(primitive.indices)) {
                        readAccessor(gltf, accessors[primitive.indices], indices, false);
                    } else {
                        for (k = 0; k < accessorCount; k++) {
                            indices.push(k);
                        }
                    }
                    if (indexOffset > 0) {
                        indicesLength = indices.length;
                        for (j = startIndices; j < indicesLength; j++) {
                            indices[j] += indexOffset;
                        }
                    }
                    indexOffset += accessor.count;
                }
                if (indices.length > 0) {
                    primitives.push(createPrimitive(gltf, attributes, attributeTypes, indices, materialId, mode, uint32Enabled));
                }
            } else if (concatenatePrimitivesLength > 0) {
                primitives.push(concatenatePrimitives[0]);
            }
            var preservePrimitivesLength = preservePrimitives.length;
            for (i = 0; i < preservePrimitivesLength; i++) {
                primitives.push(preservePrimitives[i]);
            }
        }
    }
    return primitives;
}

function createPrimitive(gltf, attributes, attributeTypes, indices, materialId, mode, uint32Enabled) {
    var primitive = {
        attributes : {},
        material : materialId,
        mode : mode,
        extras : {
            _pipeline : {}
        }
    };
    if(defined(indices)) {
        primitive.indices = createAccessor(gltf, indices, 'SCALAR',
            uint32Enabled ? WebGLConstants.UNSIGNED_INT : WebGLConstants.UNSIGNED_SHORT,
            WebGLConstants.ELEMENT_ARRAY_BUFFER);
    }
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
            var attributeTypeData = attributeTypes[semantic];
            primitive.attributes[semantic] = createAccessor(gltf, attributes[semantic],
                attributeTypeData.type, attributeTypeData.componentType, WebGLConstants.ARRAY_BUFFER);
        }
    }
    return primitive;
}

function getVertexCount(primitive, accessors) {
    var attributes = primitive.attributes;
    var vertexCount = 0;
    for (var attributeId in attributes) {
        if (attributes.hasOwnProperty(attributeId)) {
            var accessorId = attributes[attributeId];
            vertexCount = Math.max(vertexCount, accessors[accessorId].count);
        }
    }
    return vertexCount;
}

function SortablePrimitive(primitive, accessors) {
    this.primitive = primitive;
    this.vertexCount = getVertexCount(primitive, accessors);
}

function compareVertexCounts(primitiveA, primitiveB) {
    return primitiveA.vertexCount - primitiveB.vertexCount;
}

function subdividePrimitiveGroup(primitiveGroup, accessors, indexMax) {
    // Make a pass over all the primitives in the group and estimate what the biggest index result will be,
    // assuming that the largest index in each primitive is vertex count - 1.
    var indexOffset = 0;
    var primitiveCount = primitiveGroup.length;
    var needsSubdivision = false;
    var i, primitive, vertexCount;
    for (i = 0; i < primitiveCount; i++) {
        primitive = primitiveGroup[i];
        vertexCount = getVertexCount(primitive, accessors);
        if (vertexCount - 1 + indexOffset > indexMax) {
            needsSubdivision = true;
            break;
        }
        indexOffset += vertexCount;
    }

    if (!needsSubdivision) {
        return [primitiveGroup];
    }

    // If the estimate will overflow, sort the primitives by indices count.
    // "bin" primitives together, creating a new "bin" when the estimated new index will overflow.
    var sortablePrimitives = new Array(primitiveCount);
    for (i = 0; i < primitiveCount; i++) {
        sortablePrimitives[i] = new SortablePrimitive(primitiveGroup[i], accessors);
    }
    sortablePrimitives.sort(compareVertexCounts);

    var currentBucket = [];
    var buckets = [currentBucket];
    indexOffset = 0;
    for(i = 0; i < primitiveCount; i++) {
        var sortablePrimitive = sortablePrimitives[i];
        primitive = sortablePrimitive.primitive;
        vertexCount = sortablePrimitive.vertexCount;
        if (vertexCount - 1 + indexOffset > indexMax) {
            // If adding this primitive to the bucket will cause overflow,
            // put it in a new bucket and restart indexOffset.
            currentBucket = [primitive];
            buckets.push(currentBucket);
            indexOffset = vertexCount;
        }
        else {
            currentBucket.push(primitive);
            indexOffset += vertexCount;
        }
    }
    return buckets;
}
