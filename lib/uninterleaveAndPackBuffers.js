'use strict';
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');

module.exports = uninterleaveAndPackBuffers;

/**
 * Repacks the accessed buffer data into contiguous chunks.
 * Also has the effect of un-interleaving interleaved accessors.
 *
 * @param gltf
 */
function uninterleaveAndPackBuffers(gltf) {
    var buffers = gltf.buffers;
    var packBufferViews = {length : 0};
    for (var bufferId in buffers) {
        if (buffers.hasOwnProperty(bufferId)) {
            packGltfBuffer(gltf, bufferId, packBufferViews);
        }
    }
    delete packBufferViews.length;
    gltf.bufferViews = packBufferViews;
}

function packGltfBuffer(gltf, bufferId, packBufferViews) {
    var buffers = gltf.buffers;
    var buffer = buffers[bufferId];
    var source = buffer.extras._pipeline.source;
    var packBuffer = new Uint8Array(source.length);
    var accessors = getAccessorsByTargetAndByteLength(gltf, bufferId);
    var offset = 0;

    var targets = [WebGLConstants.ARRAY_BUFFER, 0, WebGLConstants.ELEMENT_ARRAY_BUFFER];
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        var accessorsByByteLength = accessors[target];
        if (defined(accessorsByByteLength)) {
            offset = packAccessorsForTarget(gltf, bufferId, target, accessorsByByteLength, source, packBuffer, packBufferViews, offset);
        }
    }
    buffer.extras._pipeline.source = new Buffer(new Uint8Array(packBuffer.buffer, 0, offset));
    buffer.byteLength = offset;
}

function packAccessorsForTarget(gltf, bufferId, target, accessorsByByteLength, sourceBuffer, packBuffer, packBufferViews, offset) {
    var bufferViewId = 'bufferView_' + packBufferViews.length;
    var originalOffset = packOffset;
    var byteLengths = [4, 2, 1];
    var packOffset = 0;
    for (var i = 0; i < byteLengths.length; i++) {
        var byteLength = byteLengths[i];
        var accessorIds = accessorsByByteLength[byteLength];
        if (defined(accessorIds) && accessorIds.length > 0) {
            // Byte-boundary align the offset if it isn't already
            packOffset += packOffset % byteLength;
            packOffset = packAccessors(gltf, bufferId, target, accessorIds, sourceBuffer, packBuffer, bufferViewId, packOffset);
        }
    }
    var packBufferView = {
        buffer : bufferId,
        byteLength : packOffset - originalOffset,
        byteOffset : originalOffset,
        extras : {
            _pipeline : {
                deleteExtras : true
            }
        }
    };
    gltf.bufferViews[bufferViewId] = packBufferView;
    if (target > 0) {
        packBufferView.target = target;
    }
    packBufferViews[bufferViewId] = packBufferView;
    packBufferViews.length++;
    return offset + packOffset;
}

function packAccessors(gltf, bufferId, target, accessorsToPack, sourceBuffer, packBuffer, bufferViewId, packOffset) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var length = accessorsToPack.length;
    var bytesWritten = 0;
    for (var i = 0; i < length; i++) {
        var accessorId = accessorsToPack[i];
        var accessor = accessors[accessorId];
        var bufferView = bufferViews[accessor.bufferView];
        var byteStride = getAccessorByteStride(accessor);
        var byteOffset = accessor.byteOffset + bufferView.byteOffset;
        var numberOfComponents = numberOfComponentsForType(accessor.type);
        var componentByteLength = byteLengthForComponentType(accessor.componentType);
        var byteLength = numberOfComponents * componentByteLength;
        var offset = byteOffset;
        var count = accessor.count;
        accessor.byteStride = 0;
        accessor.bufferView = bufferViewId;
        accessor.byteOffset = packOffset + bytesWritten;
        for (var num = 0; num < count; num++) {
            for (var j = 0; j < byteLength; j++) {
                packBuffer[packOffset + bytesWritten] = sourceBuffer[offset + j];
                bytesWritten++;
            }
            offset += byteStride;
        }
    }
    return packOffset + bytesWritten;
}

function getAccessorsByTargetAndByteLength(gltf, bufferId) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var accessorsByTargetAndByteLength = {};
    for (var accessorId in accessors) {
        if (accessors.hasOwnProperty(accessorId)) {
            var accessor = accessors[accessorId];
            var bufferView = bufferViews[accessor.bufferView];
            if (bufferView.buffer === bufferId) {
                var target = defaultValue(bufferView.target, 0);
                var accessorsByByteLength = accessorsByTargetAndByteLength[target];
                if (!defined(accessorsByByteLength)) {
                    accessorsByByteLength = {};
                    accessorsByTargetAndByteLength[target] = accessorsByByteLength;
                }
                var byteLength = byteLengthForComponentType(accessor.componentType);
                var accessorIds = accessorsByByteLength[byteLength];
                if (!defined(accessorIds)) {
                    accessorIds = [];
                    accessorsByByteLength[byteLength] = accessorIds;
                }
                accessorIds.push(accessorId);
            }
        }
    }
    return accessorsByTargetAndByteLength;
}