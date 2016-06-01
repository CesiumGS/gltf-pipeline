'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
module.exports = quantizeAttributes;

/**
 *
 * @param gltf
 * @param options
 *
 * @returns glTF with quantized attributes
 *
 * @example
 * // Quantize the positions of a simple mesh
 * var gltf = {
 *     "accessors": {
 *         "accessor_0": {...}
 *         "accessor_1": {...}
 *     },
 *     "meshes": {
 *         "geometry": {
 *             "name": "Mesh",
 *             "primitives": [
 *                 {
 *                     "attributes": {
 *                         "NORMAL": "accessor_0",
 *                         "POSITION": "accessor_1"
 *                     }
 *                 }
 *             ]
 *         }
 *     }
 * };
 * var options = {
 *     "attributes": {
 *         "geometry": {
 *             "0": ["POSITION"]
 *         }
 *     }
 * };
 * quantizeAttributes(gltf, options);
 *
 * // Quantize and explicitly chunk 
 */
function quantizeAttributes(gltf, options) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;
    var extensionsUsed = gltf.extensionsUsed;
    var accessorIds = {};
    var attributes;
    var attribute;
    var meshId;
    var primitives;
    var primitive;
    var i, j;

    // Retrieve the accessors that should be quantized
    if (defined(options)) {
        attributes = options.attributes;
        if (defined(attributes)) {
            for (meshId in meshes) {
                if (meshes.hasOwnProperty(meshId)) {
                    var meshAttributes = attributes[meshId];
                    if (defined(meshAttributes)) {
                        primitives = meshes[meshId].primitives;
                        if (defined(primitives)) {
                            for (var stringIndex in meshAttributes) {
                                if (meshAttributes.hasOwnProperty(stringIndex)) {
                                    var attributeArray = meshAttributes[stringIndex];
                                    var index = parseInt(stringIndex);
                                    primitive = primitives[index];
                                    if (defined(primitive)) {
                                        for (i = 0; i < attributeArray.length; i++) {
                                            attribute = attributeArray[i];
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
        }
        // Quantize all valid attributes
        else {
            for (meshId in meshes) {
                if (meshes.hasOwnProperty(meshId)) {
                    var mesh = meshes[meshId];
                    primitives = mesh.primitives;
                    if (defined(primitives)) {
                        for (i = 0; i < primitives.length; i++) {
                            primitive = primitives[i];
                            attributes = primitive.attributes;
                            if (defined(attributes)) {
                                for (attribute in attributes) {
                                    if (attributes.hasOwnProperty(attribute)) {
                                        if (attribute.indexOf("NORMAL") >= 0 ||
                                            attribute.indexOf("POSITION") >= 0 ||
                                            attribute.indexOf("TEXCOORD") >= 0 ||
                                            attribute.indexOf("JOINT") >= 0 ||
                                            attribute.indexOf("WEIGHT") >= 0 ||
                                            attribute.indexOf("COLOR") >= 0
                                        ) {
                                            var accessor = attributes[attribute];
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

    // Generate quantized attributes
    for (var accessorId in accessorIds) {
        if (accessorIds.hasOwnProperty(accessorId)) {
            var attribute = accessorIds[accessorId];
            var accessor = accessors[accessorId];
            // as of right now, we only support 32-bit float to 16-bit int quantization
            if (accessor.componentType != 5126) {
                break;
            }
            accessor.extensions = {
                "WEB3D_quantized_attributes": {}
            };
            attributes = accessor.extensions.WEB3D_quantized_attributes;
            var accessorData = getAccessorData(gltf, accessorId);
            var min = accessorData.min;
            var max = accessorData.max;

            var decodeMatrix = [];
            var precision = Math.pow(2, 16) - 1;
            for (j = 0; j < min.length + 1; j++) {
                for (var k = 0; k < min.length + 1; k++) {
                    if (j == min.length) {
                        if (j == k) {
                            decodeMatrix.push(1);
                        }
                        else {
                            decodeMatrix.push(min[k]);
                        }
                    }
                    else if (j == k) {
                        decodeMatrix.push((max[j] - min[j]) / precision);
                    }
                    else {
                        decodeMatrix.push(0);
                    }
                }
            }
            // decodedMin and decodedMax are required for POSITION attributes
            if (attribute === "POSITION") {
                attributes.decodedMin = min;
                attributes.decodedMax = max;
            }
            attributes.decodeMatrix = decodeMatrix;


            // Quantize the data
            var data = accessorData.data;
            var encoded = new Uint16Array(data.length);
            var index;
            for (j = 0; j < data.length; j++) {
                index = j % min.length;
                encoded[j] = (data[j] - min[index]) * precision / (max[index] - min[index]);
            }

            //TODO: Repack the buffers once, don't do it for each accessor
            //Adjust buffer to be float aligned
            var shift = (encoded.length * 2) % 4;

            var bufferId = accessorData.bufferId;
            var buffer = accessorData.buffer;
            var source = buffer.extras._pipeline.source;
            var offset = accessorData.byteOffset;
            var length = accessorData.byteLength;
            var byteSizeDifference = length - (encoded.length * 2 + shift);

            var output = new Uint8Array(buffer.byteLength - byteSizeDifference);
            output.set(source.slice(0, offset));
            output.set(new Uint8Array(encoded.buffer), offset);
            output.set(source.slice(offset + length), offset + encoded.length * 2 + shift);

            accessor.byteStride = accessor.byteStride / 2;
            accessor.componentType = 5123;

            // Overwrite the buffer
            gltf.buffers[accessorData.bufferId] = {
                type: "arraybuffer",
                byteLength: output.length,
                extras: {
                    _pipeline: {
                        source: output,
                        deleteExtras: true,
                        extension: buffer.extras._pipeline.extension
                    }
                }
            };

            // Correct the bufferview
            var bufferView = accessorData.bufferView;
            bufferView.byteLength -= byteSizeDifference;

            //correct offsets and for any buffer views that use the same buffer
            for (var bufferViewId in gltf.bufferViews) {
                if (gltf.bufferViews.hasOwnProperty(bufferViewId)) {
                    bufferView = gltf.bufferViews[bufferViewId];
                    if (bufferView.buffer === bufferId) {
                        if (bufferView.byteOffset > offset) {
                            bufferView.byteOffset -= byteSizeDifference;
                        }
                    }
                }
            }

            //correct offsets for any accessors that use the same bufferview
            for (var otherAccessorId in accessors) {
                if (accessors.hasOwnProperty(otherAccessorId)) {
                    var otherAccessor = accessors[otherAccessorId];
                    if (otherAccessor.bufferView === accessor.bufferView) {
                        if (otherAccessor.byteOffset > accessor.byteOffset) {
                            otherAccessor.byteOffset -= byteSizeDifference;
                        }
                    }
                }
            }
        }
    }
    // Add WEB3D_quantized_attributes extension to extensionsUsed
    if (!defined(extensionsUsed)) {
        extensionsUsed = [];
        gltf.extensionsUsed = extensionsUsed;
    }
    extensionsUsed.push('WEB3D_quantized_attributes');
}

function getAccessorData(gltf, accessorId) {
    var accessor = gltf.accessors[accessorId];
    var data = {
        min: accessor.min,
        max: accessor.max,
        data: undefined,
        bufferId: undefined,
        buffer: undefined,
        bufferViewId: undefined,
        bufferView: undefined,
        byteLength: 0,
        byteOffset: 0
    };

    var byteStride = accessor.byteStride;
    if (!defined(byteStride) || byteStride == 0) {
        byteStride = 1;
    }
    var componentByteLength = getByteLengthForComponentType(accessor.componentType);
    var numComponents = byteStride/componentByteLength;
    data.byteLength = byteStride * accessor.count;

    var bufferViewId = accessor.bufferView;
    var bufferView = gltf.bufferViews[bufferViewId];
    data.bufferViewId = bufferViewId;
    data.bufferView = bufferView;
    data.byteOffset = accessor.byteOffset + bufferView.byteOffset;

    var bufferId = bufferView.buffer;
    var buffer = gltf.buffers[bufferId];
    data.bufferId = bufferId;
    data.buffer = buffer;

    var source = buffer.extras._pipeline.source;
    var typedArray = arrayForComponentType(accessor.componentType, source, data.byteOffset, data.byteLength);
    data.data = typedArray;

    data.min = [];
    data.max = [];

    for (var i = 0; i < typedArray.length; i++) {
        var element = typedArray[i];
        var index = i % numComponents;
        if (index >= data.min.length) {
            data.min.push(element);
            data.max.push(element);
        }
        else {
            if (element < data.min[index]) {
                data.min[index] = element;
            }
            if (element > data.max[index]) {
                data.max[index] = element;
            }
        }
    }
    accessor.min = data.min;
    accessor.max = data.max;
    return data;
}

function getByteLengthForComponentType(type) {
    switch (type) {
        case 5120:
        case 5121:
            return 1;
        case 5122:
        case 5123:
            return 2;
        case 5126:
            return 4;
    }
}

function arrayForComponentType(type, buffer, offset, length) {
    var arrayBuffer = undefined;
    switch (type) {
        case 5120:
            return new Int8Array(arrayBuffer);
        case 5121:
            return new Uint8Array(arrayBuffer);
        case 5122:
            return new Int16Array(arrayBuffer);
        case 5123:
            return new Uint16Array(arrayBuffer);
        case 5126:
            return toFloat32Array(buffer, offset, length);
    }
}

function toFloat32Array(buffer, offset, length) {
    var nodeBuffer = new Buffer(buffer);
    var array = new Float32Array(length / Float32Array.BYTES_PER_ELEMENT);
    var i = 0;
    var byteOffset = offset;
    while(byteOffset < length + offset) {
        array[i] = nodeBuffer.readFloatLE(byteOffset);
        byteOffset += Float32Array.BYTES_PER_ELEMENT;
        i++
    }
    return array;
}