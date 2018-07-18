'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');
var writeBufferComponent = require('./writeBufferComponent');
var removeUnusedVertices = require('./removeUnusedVertices');

module.exports = mergeDuplicateVertices;

/**
 * Looks for duplicated vertices in a glTF hierarchy and merges them,
 * modifying indices to account for the change if they exist.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with merged duplicate vertices.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 * @see removeUnusedVertices
 */
function mergeDuplicateVertices(gltf) {
    return mergeDuplicateVertices._implementation(gltf);
}

mergeDuplicateVertices._implementation = function (gltf) {
    var meshes = gltf.meshes;
    var indexAccessors = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            // Build a dictionary of duplicate index mapping for each index accessor
            findDuplicateVerticesInMesh(gltf, mesh, indexAccessors);
        }
    }
    mergeDuplicateVerticesFromMapping(gltf, indexAccessors);
    removeUnusedVertices(gltf);
    return gltf;
};

function mergeDuplicateVerticesFromMapping(gltf, indexAccessors) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    for (var indexAccessorId in indexAccessors) {
        if (indexAccessors.hasOwnProperty(indexAccessorId)) {
            var accessor = accessors[indexAccessorId];
            var bufferViewId = accessor.bufferView;
            var bufferView = bufferViews[bufferViewId];
            var bufferId = bufferView.buffer;
            var buffer = buffers[bufferId];
            var source = buffer.extras._pipeline.source;
            var byteStride = getAccessorByteStride(accessor);
            var byteOffset = accessor.byteOffset + bufferView.byteOffset;
            var numIndices = accessor.count;
            var duplicateMapping = indexAccessors[indexAccessorId];
            for (var i = 0; i < numIndices; i++) {
                var index = readBufferComponent(source, accessor.componentType, byteOffset + byteStride * i);
                var mappedIndex = duplicateMapping[index];
                if (defined(mappedIndex) && mappedIndex !== index) {
                    writeBufferComponent(source, accessor.componentType, mappedIndex, byteOffset + byteStride * i);
                }
            }
        }
    }
}

function findDuplicateVerticesInMesh(gltf, mesh, indexAccessors) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var primitives = mesh.primitives;
    var primitivesLength = primitives.length;
    for (var n = 0; n < primitivesLength; n++) {
        var primitive = primitives[n];
        var indexAccessorId = primitive.indices;
        var attribute;
        if (defined(indexAccessorId)) {
            var duplicateMapping = indexAccessors[indexAccessorId];
            if (!defined(duplicateMapping)) {
                duplicateMapping = {};
                indexAccessors[indexAccessorId] = duplicateMapping;
            }
            var indexAccessor = accessors[indexAccessorId];
            var attributes = primitive.attributes;
            var attributeArray = [];
            var attributeBufferInfo = {};
            for (attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    attributeArray.push(attribute);
                    var attributeAccessorId = attributes[attribute];
                    var attributeAccessor = accessors[attributeAccessorId];
                    var attributeBufferViewId = attributeAccessor.bufferView;
                    var attributeBufferView = bufferViews[attributeBufferViewId];
                    var attributeBufferId = attributeBufferView.buffer;
                    var attributeBuffer = buffers[attributeBufferId];
                    attributeBufferInfo[attribute] = {
                        buffer: attributeBufferId,
                        byteOffset: attributeBufferView.byteOffset + attributeAccessor.byteOffset,
                        byteStride: getAccessorByteStride(attributeAccessor),
                        componentType: attributeAccessor.componentType,
                        elementByteLength: byteLengthForComponentType(attributeAccessor.componentType) * numberOfComponentsForType(attributeAccessor.type),
                        source: attributeBuffer.extras._pipeline.source
                    };
                }
            }
            var indexBufferViewId = indexAccessor.bufferView;
            var indexBufferView = bufferViews[indexBufferViewId];
            var indexBufferId = indexBufferView.buffer;
            var indexBuffer = buffers[indexBufferId];
            var indexByteStride = getAccessorByteStride(indexAccessor);
            var indexComponentType = indexAccessor.componentType;
            var indexSource = indexBuffer.extras._pipeline.source;
            var indexByteOffset = indexAccessor.byteOffset + indexBufferView.byteOffset;
            var valueTree = {};
            for (var i = 0; i < indexAccessor.count; i++) {
                var index = readBufferComponent(indexSource, indexComponentType, indexByteOffset + indexByteStride * i);
                var mapping = duplicateMapping[index];
                var subTree = valueTree;
                var numAttributes = attributeArray.length;
                for (var k = 0; k < numAttributes; k++) {
                    attribute = attributeArray[k];
                    var bufferInfo = attributeBufferInfo[attribute];
                    var value = '';
                    var byteOffset = bufferInfo.byteOffset + bufferInfo.byteStride * index;
                    //Build a string of byte values representing the attribute
                    for (var m = 0; m < bufferInfo.elementByteLength; m++) {
                        value += bufferInfo.source[byteOffset + m];
                        value += '_';
                    }
                    if (k === numAttributes - 1) {
                        var originalIndex = subTree[value];
                        if ((!defined(mapping) && defined(originalIndex)) || (defined(mapping) && originalIndex === mapping)) {
                            // This set of attributes is a duplicate of one at another index
                            duplicateMapping[index] = originalIndex;
                            subTree[value] = originalIndex;
                        } else {
                            if (defined(originalIndex)) {
                                subTree[value] = originalIndex;
                            } else {
                                subTree[value] = index;
                            }
                            duplicateMapping[index] = index;
                        }
                    } else if (!defined(subTree[value])) {
                        subTree[value] = {};
                    }
                    subTree = subTree[value];
                }
            }
        }
    }
}
