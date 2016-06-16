'use strict';
var Cesium = require('cesium');
var DeveloperError = Cesium.DeveloperError;
var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponentType = require('./readBufferComponentType');
var writeBufferComponentType = require('./writeBufferComponentType');
var removeUnusedVertices = require('./removeUnusedVertices');

module.exports = mergeDuplicateVertices;

/**
 * Looks for duplicated vertices in a glTF hierarchy and merges them,
 * modifying indices to account for the change if they exist.
 *
 * @param {Object} [gltf] A glTF hierarchy.
 */
function mergeDuplicateVertices(gltf) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            mergeDuplicateVerticesInMesh(gltf, mesh);
        }
    }
    removeUnusedVertices(gltf);
}

function mergeDuplicateVerticesInMesh(gltf, mesh) {
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
            var seenIndices = {};
            for (var i = 0; i < indexAccessor.count; i++) {
                var index = readBufferComponentType(indexSource, indexComponentType, indexByteOffset);
                if (!defined(seenIndices[index])) {
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
                            if (!defined(subTree[value])) {
                                // We haven't seen this set of attributes before
                                subTree[value] = index;
                            } else {
                                // This set of attributes is a duplicate of the one at another index
                                var originalIndex = subTree[value];
                                writeBufferComponentType(indexSource, indexComponentType, originalIndex, indexByteOffset);
                            }
                        } else if (!defined(subTree[value])) {
                            subTree[value] = {};
                        }
                        subTree = subTree[value];
                    }
                    seenIndices[index] = true;
                }
            }
            indexByteOffset += indexByteStride;

        }
    }
}