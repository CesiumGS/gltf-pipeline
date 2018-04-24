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
            var bufferView = bufferViews[bufferViewIds[i]];
            bufferView.byteOffset += lengthSoFar;
            bufferView.buffer = 0;
        }
        name = defaultValue(name, buffer.name);
        var sourceBuffer = getBufferPadded(buffer.extras._pipeline.source);
        var sourceBufferLength = sourceBuffer.length;
        buffersToMerge.push(sourceBuffer);
        lengthSoFar += sourceBufferLength;
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
