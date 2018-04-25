'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var getBufferPadded = require('./getBufferPadded');

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
    var bufferViews = gltf.bufferViews;
    var bufferViewsForBuffers = getBufferViewsForBuffers(gltf);

    var buffersToMerge = [];
    var lengthSoFar = 0;
    var name;
    ForEach.buffer(gltf, function(buffer, bufferId) {
        var bufferViewIds = bufferViewsForBuffers[bufferId];
        var length = bufferViewIds.length;
        for (var i = 0; i < length; ++i) {
            // Check if new bufferView needs to be aligned to 4 bytes.
            var alignment = lengthSoFar & 3;
            if (alignment > 0) {
                var bytesToPad = 4 - alignment;
                var emptyBuffer = Buffer.alloc(bytesToPad);
                buffersToMerge.push(emptyBuffer);
                lengthSoFar += bytesToPad;
            }

            // Get the data from the bufferView.
            var bufferView = bufferViews[bufferViewIds[i]];
            var sourceBufferViewData = buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
            bufferView.byteOffset = lengthSoFar;
            bufferView.buffer = 0;

            buffersToMerge.push(sourceBufferViewData);
            lengthSoFar += sourceBufferViewData.length;
        }
        name = defaultValue(name, buffer.name);
    });

    var mergedSource = Buffer.concat(buffersToMerge);

    gltf.buffers = [{
        name : name,
        byteLength : mergedSource.length,
        extras : {
            _pipeline : {
                source : mergedSource
            }
        }
    }];

    return gltf;
}

function getBufferViewsForBuffers(gltf) {
    var bufferViewsForBuffers = {};
    ForEach.bufferView(gltf, function(bufferView, bufferViewId) {
        var bufferId = bufferView.buffer;
        var bufferViewsForBuffer = bufferViewsForBuffers[bufferId];
        if (!defined(bufferViewsForBuffer)) {
            bufferViewsForBuffer = [];
            bufferViewsForBuffers[bufferId] = bufferViewsForBuffer;

        }
        bufferViewsForBuffer.push(bufferViewId);
    });
    return bufferViewsForBuffers;
}
