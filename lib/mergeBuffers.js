'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

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

    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(gltf.buffers[bufferView.buffer])) {
            var buffer = gltf.buffers[bufferView.buffer];
            var sourceBufferViewData = buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

            // Check if new bufferView needs to be aligned to 4 bytes.
            var alignment = lengthSoFar & 3;
            if (alignment > 0) {
                var bytesToPad = 4 - alignment;
                var emptyBuffer = Buffer.alloc(bytesToPad);
                buffersToMerge.push(emptyBuffer);
                lengthSoFar += bytesToPad;
            }

            bufferView.byteOffset = lengthSoFar;
            bufferView.buffer = 0;

            buffersToMerge.push(sourceBufferViewData);
            lengthSoFar += sourceBufferViewData.length;
        }
    });

    var mergedSource = Buffer.concat(buffersToMerge);

    gltf.buffers = [{
        byteLength : mergedSource.length,
        extras : {
            _pipeline : {
                source : mergedSource
            }
        }
    }];

    return gltf;
}
