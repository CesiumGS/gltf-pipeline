'use strict';
var Cesium = require('cesium');
var addToArray = require('./addToArray');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var ForEach = require('./ForEach');
var mergeBuffers = require('./mergeBuffers');
var numberOfComponentsForType = require('./numberOfComponentsForType');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;

module.exports = uninterleaveAndPackBuffers;

/**
 * Repacks the buffer data into contiguous chunks and uninterleaves accessors.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with repacked buffers.
 *
 * @private
 */
function uninterleaveAndPackBuffers(gltf) {
    var interleavedAccessors = getInterleavedAccessors(gltf);
    var packed = isPacked(gltf);

    if (interleavedAccessors.length === 0 && packed) {
        return gltf;
    }

    uninterleaveAccessors(gltf, interleavedAccessors);
    splitAccessors(gltf);
    splitBuffers(gltf);
    mergeBuffers(gltf);

    return gltf;
}

function splitBuffers(gltf) {
    var newBufferViews = [];
    var newBuffers = [];
    var objects = getObjectsWithBufferViews(gltf);
    var length = objects.length;
    for (var i = 0; i < length; ++i) {
        var object = objects[i];
        var bufferView = gltf.bufferViews[object.bufferView];
        var buffer = gltf.buffers[bufferView.buffer];
        var source = buffer.extras._pipeline.source;
        var newBufferId = addToArray(newBuffers, {
            extras : {
                _pipeline : {
                    source : Buffer.from(source.buffer, bufferView.byteOffset, bufferView.byteLength)
                }
            },
            byteLength : bufferView.byteLength
        });
        object.bufferView = addToArray(newBufferViews, {
            buffer : newBufferId,
            byteOffset : 0,
            byteLength : bufferView.byteLength,
            target : bufferView.target
        });
    }
    gltf.bufferViews = newBufferViews;
    gltf.buffers = newBuffers;
}

function getObjectsWithBufferViews(gltf) {
    var objects = [];
    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            objects.push(accessor);
        }
    });

    ForEach.shader(gltf, function(shader) {
        if (defined(shader.bufferView)) {
            objects.push(shader);
        }
    });

    ForEach.image(gltf, function(image) {
        if (defined(image.bufferView)) {
            objects.push(image);
        }
        ForEach.compressedImage(image, function(compressedImage) {
            if (defined(compressedImage.bufferView)) {
                objects.push(compressedImage);
            }
        });
    });
}

function splitAccessors(gltf) {
    var accessors = gltf.accessors;
    var length = accessors.length;
    for (var i = 0; i < length; ++i) {
        var accessor = accessors[i];
        var bufferView = gltf.bufferViews[accessor.bufferView];
        if (defined(bufferView)) {
            var accessorByteLength = accessor.count * getAccessorByteStride(gltf, accessor);
            accessor.bufferView = addToArray(gltf.bufferViews, {
                buffer : bufferView.buffer,
                byteOffset : bufferView.byteOffset + accessor.byteOffset,
                byteLength : accessorByteLength,
                target : bufferView.target
            });
            accessor.byteOffset = 0;
        }
    }
}

function uninterleaveAccessors(gltf, accessors) {
    var length = accessors.length;
    for (var i = 0; i < length; ++i) {
        var accessor = accessors[i];
        var bufferView = gltf.bufferViews[accessor.bufferView];
        if (defined(bufferView)) {
            var source = readAccessor(gltf, accessor);
            var bufferId = addToArray(gltf.buffers, {
                byteLength : source.length,
                extras : {
                    _pipeline : {
                        source : source
                    }
                }
            });
            accessor.bufferView = addToArray(gltf.bufferViews, {
                buffer : bufferId,
                byteOffset : 0,
                byteLength : source.length,
                byteStride : 0,
                target : bufferView.target
            });
            accessor.byteOffset = 0;
        }
    }
}

function readAccessor(gltf, accessor) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var byteStride = getAccessorByteStride(gltf, accessor);
    var sourceByteOffset = accessor.byteOffset + bufferView.byteOffset;
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var count = accessor.count;
    var componentByteLength = byteLengthForComponentType(accessor.componentType);
    var attributeByteLength = numberOfComponents * componentByteLength;
    var bufferByteLength = attributeByteLength * count;
    var source = gltf.buffers[bufferView.buffer].extras._pipeline.source;
    var newSource = Buffer.alloc(bufferByteLength);
    for (var i = 0; i < count; ++i) {
        for (var j = 0; j < componentByteLength; ++j) {
            newSource[i * attributeByteLength + j] = source[sourceByteOffset + j];
        }
        sourceByteOffset += byteStride;
    }
    return newSource;
}

function getInterleavedAccessors(gltf) {
    var interleavedAccessors = [];

    // Map buffer views to a list of accessors
    var bufferViewMap = {};
    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            bufferViewMap[accessor.bufferView] = defaultValue(bufferViewMap[accessor.bufferView], []);
            bufferViewMap[accessor.bufferView].push(accessor);
        }
    });

    // Check if any accessors overlap
    for (var bufferViewId in bufferViewMap) {
        if (bufferViewMap.hasOwnProperty(bufferViewId)) {
            var accessors = bufferViewMap[bufferViewId];
            accessors.sort(function (a, b) {
                return a.byteOffset - b.byteOffset;
            });
            var byteOffset = 0;
            var accessorsLength = accessors.length;
            for (var i = 0; i < accessorsLength; ++i) {
                var accessor = accessors[i];
                if (accessor.byteOffset < byteOffset) {
                    // Assume all accessors referencing this buffer view are interleaved.
                    interleavedAccessors = interleavedAccessors.concat(accessors);
                    break;
                }
                var accessorByteStride = getAccessorByteStride(gltf, accessor);
                byteOffset = accessor.byteOffset + accessor.count * accessorByteStride;
            }
        }
    }

    return interleavedAccessors;
}

function roundByteOffset(byteOffset) {
    var boundary = 4;
    var remainder = byteOffset % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    return byteOffset + padding;
}

function isPacked(gltf) {
    // Map buffers to a list of buffer views
    var bufferMap = {};
    ForEach.bufferView(gltf, function (bufferView) {
        bufferMap[bufferView.buffer] = defaultValue(bufferMap[bufferView.buffer], []);
        bufferMap[bufferView.buffer].push(bufferView);
    });

    // Check if there is extra space between buffer views or at the end of the buffer
    for (var bufferId in bufferMap) {
        if (bufferMap.hasOwnProperty(bufferId)) {
            var buffer = gltf.buffers[bufferId];
            var bufferViews = bufferMap[bufferId];
            bufferViews.sort(function (a, b) {
                return a.byteOffset - b.byteOffset;
            });
            var byteOffset = 0;
            var bufferViewsLength = bufferViews.length;
            for (var i = 0; i < bufferViewsLength; ++i) {
                var bufferView = bufferViews[i];
                if (bufferView.byteOffset > roundByteOffset(byteOffset)) {
                    return false;
                }
                byteOffset = bufferView.byteOffset;
            }
            if (buffer.byteLength > roundByteOffset(byteOffset)) {
                return false;
            }
        }
    }

    return true;
}
