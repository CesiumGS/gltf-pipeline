'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers into one buffer.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with its buffers merged into one.
 *
 * @private
 */
function mergeBuffers(gltf) {
    var buffersToMerge = [];
    var lengthSoFar = 0;

    var name;
    ForEach.buffer(gltf, function(buffer) {
        name = defaultValue(name, buffer.name);
    });

    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(gltf.buffers[bufferView.buffer])) {
            var buffer = gltf.buffers[bufferView.buffer];
            var sourceBufferViewData = buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

            var bufferViewPadding = getPadding(lengthSoFar);
            buffersToMerge.push(bufferViewPadding);
            lengthSoFar += bufferViewPadding.length;

            bufferView.byteOffset = lengthSoFar;
            bufferView.buffer = 0;

            buffersToMerge.push(sourceBufferViewData);
            lengthSoFar += sourceBufferViewData.length;
        }
    });

    var bufferPadding = getPadding(lengthSoFar);
    buffersToMerge.push(bufferPadding);
    var mergedSource = Buffer.concat(buffersToMerge);

    gltf.buffers = [{
        name: name,
        byteLength: mergedSource.length,
        extras: {
            _pipeline: {
                source: mergedSource
            }
        }
    }];

    return gltf;
}

function getPadding(length) {
    var alignment = length & 3;
    if (alignment > 0) {
        var bytesToPad = 4 - alignment;
        return Buffer.alloc(bytesToPad);
    }
    return Buffer.alloc(0);
}
