'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var packBuffers = require('./packBuffers');

module.exports = quantizeAttributes;

/**
 * Quantizes attributes in the provided glTF using the WEB3D_quantized_attributes extension.
 * If options is undefined, all quantizable attributes will be quantized with the default options.
 * If options.attributes is undefined, all quantizable attributes will be quantized with the provided options.
 * If options.precision is undefined, the decodeMatrix be written in its full form.
 *
 * @param {Object} [gltf] A javascript object holding a glTF hierarchy.
 * @param {Object} [options=undefined] Defines more specific quantization behavior.
 * @param {Object} [options.attributes=undefined] Defines specific attributes to be quantized. This should be as arranged as meshId -> primitiveIndex -> [semantic_0, semantic_1, ... semantic_N]
 * @param {Number} [options.precision=undefined] Restricts the number of decimal places in the decodeMatrix.
 *
 * @returns glTF with quantized attributes
 *
 * @example
 * var gltf = {
 *     accessors: {
 *         accessor_0: {...}
 *         accessor_1: {...}
 *     },
 *     meshes: {
 *         geometry: {
 *             name: 'Mesh',
 *             primitives: [
 *                 {
 *                     attributes: {
 *                         NORMAL: 'accessor_0',
 *                         POSITION: 'accessor_1'
 *                     }
 *                 }
 *             ]
 *         }
 *     }
 * };
 *
 * // Quantize all valid attributes
 * quantizeAttributes(gltf);
 *
 * // Quantize all valid attributes, restricting the decodeMatrix to 6 decimal places
 * quantizeAttributes(gltf, {
 *     precision: 6
 * }
 *
 * // Quantize just the positions of a specific mesh
 * quantizeAttributes(gltf, {
 *     attributes: {
 *         geometry: {
 *             0: ['POSITION']
 *         }
 *     }
 * });
 */
function quantizeAttributes(gltf, options) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var i;
    var accessorIds = {};
    var precision = undefined;
    var range = Math.pow(2, 16) - 1;

    // Retrieve the accessors that should be quantized
    var quantizeAll = true;
    if (defined(options)) {
        attributes = options.attributes;
        if (defined(attributes)) {
            quantizeAll = false;
            accessorIds = getQuantizableAttributes(gltf, attributes);
        }
        if (defined(options.precision)) {
            precision = 10^options.precision;
        }
    }
    // Quantize all valid attributes
    if (quantizeAll) {
        accessorIds = getAllQuantizableAttributes(gltf);
    }

    // Generate quantized attributes
    var isQuantized = false;
    for (var accessorId in accessorIds) {
        if (accessorIds.hasOwnProperty(accessorId)) {
            var accessor = accessors[accessorId];
            var bufferViewId = accessor.bufferView;
            var bufferView = bufferViews[bufferViewId];
            var bufferId = bufferView.buffer;
            var buffer = buffers[bufferId];
            accessor.extensions = {
                "WEB3D_quantized_attributes": {}
            };
            var attributes = accessor.extensions.WEB3D_quantized_attributes;
            // accessor min and max are the extremes of the range
            var min = accessor.min;
            var max = accessor.max;
            accessor.min = Array(min.length).fill(0);
            accessor.max = Array(max.length).fill(range);
            var decodeMatrix = createDecodeMatrix(min, max, range);

            // change matrix precision to save space
            if (defined(precision)) {
                for (i = 0; i < decodeMatrix.length; i++) {
                    var value = decodeMatrix[i];
                    decodeMatrix[i] = Math.floor(value * precision) / precision;
                }
            }
            attributes.decodedMin = min;
            attributes.decodedMax = max;
            attributes.decodeMatrix = decodeMatrix;

            // Quantize the data in place
            var source = buffer.extras._pipeline.source;
            var offset = accessor.byteOffset + bufferView.byteOffset;
            var num = 0;
            var count = accessor.count;
            var byteStride = getAccessorByteStride(accessor);
            accessor.byteStride = byteStride;
            var componentByteLength = byteLengthForComponentType(accessor.componentType);
            var numberOfComponents = numberOfComponentsForType(accessor.type);
            for (i = offset; num < count; i+=byteStride) {
                for (var j = 0; j < numberOfComponents; j++) {
                    var value = source.readFloatLE(i + j * componentByteLength);
                    var encoded = Math.round((value - min[j]) * range / (max[j] - min[j]));
                    source.writeUInt16LE(encoded, i + j * 2);
                }
                num++;
            }
            accessor.componentType = 5123;
            isQuantized = true;
        }
    }
    if (isQuantized) {
        // Repack the buffers
        packBuffers(gltf);
        // Finalize
        addExtensionsUsed(gltf, 'WEB3D_quantized_attributes');
    }
}

function createDecodeMatrix(min, max, range) {
    var size = min.length + 1;
    if (size === 3) {
        return createDecodeMatrix3(min, max, range);
    } else if (size === 4) {
        return createDecodeMatrix4(min, max, range);
    } else if (size === 5) {
        return createDecodeMatrix5(min, max, range);
    }
}

function createDecodeMatrix3(min, max, range) {
    return [(max[0] - min[0])/range, 0.0,                     0.0,
            0.0,                     (max[1] - min[1])/range, 0.0,
            min[0],                   min[1],                 1.0
    ];
}

function createDecodeMatrix4(min, max, range) {
    return [(max[0] - min[0])/range, 0.0,                     0.0,                     0.0,
            0.0,                     (max[1] - min[1])/range, 0.0,                     0.0,
            0.0,                     0.0,                     (max[2] - min[2])/range, 0.0,
            min[0],                  min[1],                  min[2],                  1.0
    ];
}

function createDecodeMatrix5(min, max, range) {
    return [(max[0] - min[0])/range, 0.0,                     0.0,                     0.0,                     0.0,
            0.0,                     (max[1] - min[1])/range, 0.0,                     0.0,                     0.0,
            0.0,                     0.0,                     (max[2] - min[2])/range, 0.0,                     0.0,
            0.0,                     0.0,                     0.0,                     (max[3] - min[3])/range, 0.0,
            min[0],                  min[1],                  min[2],                  min[3],                  1.0
    ];
}

function getQuantizableAttributes(gltf, attributes) {
    var meshes = gltf.meshes;
    var accessorIds = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var meshAttributes = attributes[meshId];
            if (defined(meshAttributes)) {
                var primitives = meshes[meshId].primitives;
                if (defined(primitives)) {
                    for (var stringIndex in meshAttributes) {
                        if (meshAttributes.hasOwnProperty(stringIndex)) {
                            var attributeArray = meshAttributes[stringIndex];
                            var index = parseInt(stringIndex);
                            var primitive = primitives[index];
                            if (defined(primitive)) {
                                for (var i = 0; i < attributeArray.length; i++) {
                                    var attribute = attributeArray[i];
                                    var primitiveAttributes = primitive.attributes;
                                    if (defined(primitiveAttributes)) {
                                        var accessor = primitiveAttributes[attribute];
                                        if (defined(accessor)) {
                                            accessorIds[accessor] = attribute;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return accessorIds;
}

function getAllQuantizableAttributes(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var visitedAccessors = {};
    var accessorAttributes = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            if (defined(primitives)) {
                for (var i = 0; i < primitives.length; i++) {
                    var primitive = primitives[i];
                    var attributes = primitive.attributes;
                    if (defined(attributes)) {
                        for (var attribute in attributes) {
                            if (attributes.hasOwnProperty(attribute)) {
                                if (attributeIsQuantizable(attribute)) {
                                    var accessorId = attributes[attribute];
                                    if (!defined(visitedAccessors[accessorId])) {
                                        var accessor = accessors[accessorId];
                                        if (accessorIsQuantizable(accessor)) {
                                            accessorAttributes[accessorId] = attribute;
                                        }
                                        visitedAccessors[accessorId] = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return accessorAttributes;
}

function attributeIsQuantizable(attributeSemantic) {
    return attributeSemantic.indexOf("NORMAL") >= 0 ||
        attributeSemantic.indexOf("POSITION") >= 0 ||
        attributeSemantic.indexOf("TEXCOORD") >= 0 ||
        attributeSemantic.indexOf("JOINT") >= 0 ||
        attributeSemantic.indexOf("WEIGHT") >= 0 ||
        attributeSemantic.indexOf("COLOR") >= 0;
}

function accessorIsQuantizable(accessor) {
    // This accessor is already quantized
    if (accessorIsQuantized(accessor)) {
        return false;
    }
    // Only 32-bit float to 16-bit int quantization is supported
    return accessor.componentType == 5126;
}

function accessorIsQuantized(accessor) {
    var extensions = accessor.extensions;
    if (defined(extensions)) {
        return defined(extensions.WEB3D_quantized_attributes);
    }
    return false;
}