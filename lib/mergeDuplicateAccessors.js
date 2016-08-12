'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = mergeDuplicateAccessors;

/**
 * Looks for accessors in a glTf hierarchy that contain the same data, removes all of the copies
 * and changes references to point to a single copy.
 * 
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with merged duplicate accessors.
 *
 * gltf must be initialized for the pipeline.
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function mergeDuplicateAccessors(gltf) {
    var accessors = gltf.accessors;
    var duplicateMapping = createDuplicateMapping(gltf);
    // Use the duplicate mapping to merge the accessors
    for (var accessorId in duplicateMapping) {
        if (duplicateMapping.hasOwnProperty(accessorId)) {
            var duplicates = duplicateMapping[accessorId];
            for (var i = 0; i < duplicates.length; i++) {
                var duplicateId = duplicates[i];
                var metaDuplicates = duplicateMapping[duplicateId];
                if (defined(metaDuplicates)) {
                    duplicates.concat(metaDuplicates);
                }
                replaceAccessorIdInstances(gltf, duplicateId, accessorId);
                delete duplicateMapping[duplicateId];
                delete accessors[duplicateId];
            }
        }
    }
    return gltf;
}

function replaceAccessorIdInstances(gltf, accessorId, newAccessorId) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var indices = primitive.indices;
                if (indices === accessorId) {
                    primitive.indices = newAccessorId;
                }
                var attributes = primitive.attributes;
                for (var attribute in attributes) {
                    if (attributes.hasOwnProperty(attribute)) {
                        var attributeAccessorId = attributes[attribute];
                        if (attributeAccessorId === accessorId) {
                            attributes[attribute] = newAccessorId;
                        }
                    }
                }
            }
        }
    }
}

function createDuplicateMapping(gltf) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var accessorIdArray = Object.keys(accessors);
    var duplicateMapping = {};
    for (var i = 0; i < accessorIdArray.length; i++) {
        var iAccessorId = accessorIdArray[i];
        var iAccessor = accessors[iAccessorId];
        for (var j = i+1; j < accessorIdArray.length; j++) {
            var jAccessorId = accessorIdArray[j];
            var jAccessor = accessors[jAccessorId];
            if (accessorPropertiesMatch(iAccessor, jAccessor)) {
                var iBufferViewId = iAccessor.bufferView;
                var iBufferView = bufferViews[iBufferViewId];
                var iBufferId = iBufferView.buffer;
                var iBuffer = buffers[iBufferId];
                var iBufferSource = iBuffer.extras._pipeline.source;
                var iByteOffset = iAccessor.byteOffset + iBufferView.byteOffset;
                var iByteStride = getAccessorByteStride(iAccessor);
                var count = iAccessor.count;
                var elementByteLength = byteLengthForComponentType(iAccessor.componentType) * numberOfComponentsForType(iAccessor.type);

                var jBufferViewId = jAccessor.bufferView;
                var jBufferView = bufferViews[jBufferViewId];
                var jBufferId = jBufferView.buffer;
                var jBuffer = buffers[jBufferId];
                var jBufferSource = jBuffer.extras._pipeline.source;
                var jByteOffset = jAccessor.byteOffset + jBufferView.byteOffset;
                var jByteStride = getAccessorByteStride(jAccessor);

                var accessorsMatch = true;
                for (var k = 0; k < count; k++) {
                    for (var byteOffset = 0; byteOffset < elementByteLength; byteOffset++) {
                        if (iBufferSource[iByteOffset + byteOffset] !== jBufferSource[jByteOffset + byteOffset]) {
                            accessorsMatch = false;
                            break;
                        }
                    }
                    if (!accessorsMatch) {
                        break;
                    }
                    iByteOffset += iByteStride;
                    jByteOffset += jByteStride;
                }
                if (accessorsMatch) {
                    var mapping = duplicateMapping[iAccessorId];
                    if (!defined(mapping)) {
                        mapping = [];
                        duplicateMapping[iAccessorId] = mapping;
                    }
                    mapping.push(jAccessorId);
                }
            }
        }
    }
    return duplicateMapping;
}

function accessorPropertiesMatch(accessor1, accessor2) {
    return accessor1.componentType === accessor2.componentType &&
        accessor1.count === accessor2.count &&
        accessor1.type === accessor2.type;
}