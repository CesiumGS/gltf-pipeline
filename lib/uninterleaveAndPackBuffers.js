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
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with repacked buffers.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function uninterleaveAndPackBuffers(gltf) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var packBufferViews = {length : 0};
    for (var bufferId in buffers) {
        if (buffers.hasOwnProperty(bufferId)) {
            packGltfBuffer(gltf, bufferId, packBufferViews);
        }
    }
    delete packBufferViews.length;
    gltf.bufferViews = packBufferViews;

    // Change the accessor bufferViews to point to the new bufferViews
    for (var accessorId in accessors) {
        if (accessors.hasOwnProperty(accessorId)) {
            var accessor = accessors[accessorId];
            accessor.bufferView = accessor.extras._pipeline.bufferView;
        }
    }
    return gltf;
}

function packGltfBuffer(gltf, bufferId, packBufferViews) {
    var buffers = gltf.buffers;
    var buffer = buffers[bufferId];
    var source = buffer.extras._pipeline.source;
    var packBuffer = new Uint8Array(source.length + 6); // Account for extra padding between targets
    var accessors = getAccessorsByTargetAndByteLength(gltf, bufferId);
    var offset = 0;

    var targets = [WebGLConstants.ARRAY_BUFFER, 0, WebGLConstants.ELEMENT_ARRAY_BUFFER];
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        var accessorsByByteLength = accessors[target];
        if (defined(accessorsByByteLength)) {
            offset = packAccessorsForTarget(gltf, bufferId, target, accessorsByByteLength, source, packBuffer, packBufferViews, offset);

            // End this target on a 4-byte boundary so the byteOffset of the next target's first accessor is 0
            // Don't add padding to the last target
            for (var j = i + 1; j < targets.length; ++j) {
                if (defined(accessors[targets[j]])) {
                    offset += offset % 4;
                    break;
                }
            }
        }
    }
    packBuffer = Buffer.from(new Uint8Array(packBuffer.buffer, 0, offset));
    buffer.extras._pipeline.source = packBuffer;
    buffer.byteLength = packBuffer.length;
}

function packAccessorsForTarget(gltf, bufferId, target, accessorsByByteLength, sourceBuffer, packBuffer, packBufferViews, offset) {
    var bufferViewId = 'bufferView_' + packBufferViews.length;
    var originalOffset = offset;
    var byteLengths = [4, 2, 1];
    var packOffset = offset;
    for (var i = 0; i < byteLengths.length; i++) {
        var byteLength = byteLengths[i];
        var accessorIds = accessorsByByteLength[byteLength];
        if (defined(accessorIds) && accessorIds.length > 0) {
            // Byte-boundary align the offset if it isn't already
            packOffset += packOffset % byteLength;
            packOffset = packAccessors(gltf, accessorIds, sourceBuffer, packBuffer, bufferViewId, originalOffset, packOffset);
        }
    }
    var packBufferView = {
        buffer : bufferId,
        byteLength : packOffset - originalOffset,
        byteOffset : originalOffset,
        extras : {
            _pipeline : {}
        }
    };
    if (target > 0) {
        packBufferView.target = target;
    }
    packBufferViews[bufferViewId] = packBufferView;
    packBufferViews.length++;
    return packOffset;
}

function getPipelineExtras(object) {
    var extras = object.extras;
    if (!defined(extras)) {
        extras = {};
        object.extras = extras;
    }
    var pipeline = extras._pipeline;
    if (!defined(pipeline)) {
        pipeline = {};
        extras._pipeline = pipeline;
    }
    return pipeline;
}

function packAccessors(gltf, accessorsToPack, sourceBuffer, packBuffer, bufferViewId, originalOffset, packOffset) {
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
        // Store as temp for now, finalize later
        var extras = getPipelineExtras(accessor);
        extras.bufferView = bufferViewId;
        accessor.byteOffset = packOffset - originalOffset + bytesWritten;
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
