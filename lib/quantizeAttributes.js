'use strict';
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');

module.exports = quantizeAttributes;

/**
 * Quantizes attributes in the provided glTF using the WEB3D_quantized_attributes extension.
 * If options is undefined, all quantizable attributes will be quantized with the default options.
 * If options.attributes is undefined, all quantizable attributes will be quantized with the provided options.
 * If options.precision is undefined, the decodeMatrix be written in its full form.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {Object} [options=undefined] Defines more specific quantization behavior.
 * @param {Object} [options.semantics=undefined] Defines which semantics should be quantized.
 * @param {Object} [options.exclude=undefined] Don't quantize the specified semantics
 * @param {Number} [options.precision=undefined] Restricts the number of decimal places in the decodeMatrix.
 * @param {Boolean} [options.findMinMax=false] If this is true, the accessor min and max will be calculated.
 *
 * @returns glTF with quantized attributes
 *
 * @example
 * // Quantize all valid attributes
 * quantizeAttributes(gltf);
 *
 * // Quantize all valid attributes, restricting the decodeMatrix to 6 decimal places
 * quantizeAttributes(gltf, {
 *     precision: 6
 * }
 *
 * // Quantize just the positions and normals of a model
 * quantizeAttributes(gltf, {
 *     semantics: [POSITION, NORMAL]
 * });
 * 
 * // Don't quantize the texture coordinates of the model
 * quantizeAttributes(gltf, {
 *     exclude: [TEXCOORD]
 * });
 */
function quantizeAttributes(gltf, options) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var value;
    var i;
    var accessorIds;
    var precision;
    var range = Math.pow(2, 16) - 1;

    // Retrieve the accessors that should be quantized
    var validSemantics;
    var findMinMax = false;
    if (defined(options)) {
        if (defined(options.precision)) {
            precision = Math.pow(10, options.precision);
        }
        var semantics = options.semantics;
        if (defined(semantics)) {
            validSemantics = {};
            for (i = 0; i < semantics.length; i++) {
                validSemantics[semantics[i]] = true;
            }
        }
        var exclude = options.exclude;
        if (defined(exclude)) {
            validSemantics = defaultValue(validSemantics, {});
            for (i = 0; i < exclude.length; i++) {
                validSemantics[exclude[i]] = false;
            }
        }
        findMinMax = defaultValue(options.findMinMax, false);
    }
    // Quantize all valid attributes
    accessorIds = getAllQuantizableAttributes(gltf, validSemantics);

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
            if (findMinMax) {
                var minMax = findAccessorMinMax(gltf, accessor);
                min = minMax.min;
                max = minMax.max;
            }
            accessor.min = new Array(min.length).fill(0);
            accessor.max = new Array(max.length).fill(range);
            var decodeMatrix = createDecodeMatrix(min, max, range);

            // change matrix precision to save space
            if (defined(precision)) {
                for (i = 0; i < decodeMatrix.length; i++) {
                    value = decodeMatrix[i];
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
                    value = source.readFloatLE(i + j * componentByteLength);
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
        uninterleaveAndPackBuffers(gltf);
        // Finalize
        addExtensionsUsed(gltf, 'WEB3D_quantized_attributes');
    }
}

function createDecodeMatrix(min, max, range) {
    var size = min.length + 1;
    if (size === 2) {
        return createDecodeMatrix2(min, max, range);
    } else if (size === 3) {
        return createDecodeMatrix3(min, max, range);
    } else if (size === 4) {
        return createDecodeMatrix4(min, max, range);
    } else if (size === 5) {
        return createDecodeMatrix5(min, max, range);
    }
}

function createDecodeMatrix2(min, max, range) {
    return [(max[0] - min[0])/range, 0.0,
            min[0],                  1.0
    ];
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

function getAllQuantizableAttributes(gltf, validSemantics) {
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
                                if (!defined(validSemantics) || validSemantics[attribute]) {
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

function typeIsQuantizable(type) {
    return type === 'SCALAR' ||
            type === 'VEC2' ||
            type === 'VEC3' ||
            type === 'VEC4';
}

function accessorIsQuantizable(accessor) {
    // This accessor is already quantized
    if (accessorIsQuantized(accessor)) {
        return false;
    }
    // Only 32-bit float to 16-bit int quantization is supported
    return  accessor.componentType === 5126 && typeIsQuantizable(accessor.type);
}

function accessorIsQuantized(accessor) {
    var extensions = accessor.extensions;
    if (defined(extensions)) {
        return defined(extensions.WEB3D_quantized_attributes);
    }
    return false;
}