'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers. Buffers with the same extras._pipeline.mergedBufferName will be merged together.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} [defaultName] The default name of the buffer data files.
 * @returns {Object} The glTF asset with its buffers merged.
 *
 * @private
 */
function mergeBuffers(gltf, defaultName) {
    var baseBufferName = defaultName;
    ForEach.buffer(gltf, function(buffer) {
        baseBufferName = defaultValue(buffer.name, baseBufferName);
    });
    baseBufferName = defaultValue(baseBufferName, 'buffer');

    var buffersToMerge = {};

    ForEach.bufferView(gltf, function(bufferView) {
        var buffer = gltf.buffers[bufferView.buffer];
        var mergedName = buffer.extras._pipeline.mergedBufferName;
        mergedName = defined(mergedName) ? baseBufferName + '-' + mergedName : baseBufferName;
        if (!defined(buffersToMerge[mergedName])) {
            buffersToMerge[mergedName] = {
                buffers: [],
                byteLength: 0,
                index: Object.keys(buffersToMerge).length
            };
        }
        var buffers = buffersToMerge[mergedName].buffers;
        var byteLength = buffersToMerge[mergedName].byteLength;
        var index = buffersToMerge[mergedName].index;

        var sourceBufferViewData = Buffer.from(buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength));
        var bufferViewPadding = allocateBufferPadding(byteLength);
        buffers.push(bufferViewPadding);
        byteLength += bufferViewPadding.byteLength;

        bufferView.byteOffset = byteLength;
        bufferView.buffer = index;

        buffers.push(sourceBufferViewData);
        byteLength += sourceBufferViewData.byteLength;

        buffersToMerge[mergedName].byteLength = byteLength;
    });

    var buffersLength = Object.keys(buffersToMerge).length;
    gltf.buffers = new Array(buffersLength);

    for (var mergedName in buffersToMerge) {
        if (buffersToMerge.hasOwnProperty(mergedName)) {
            var buffers = buffersToMerge[mergedName].buffers;
            var byteLength = buffersToMerge[mergedName].byteLength;
            var index = buffersToMerge[mergedName].index;
            var bufferPadding = allocateBufferPadding(byteLength);
            buffers.push(bufferPadding);
            var mergedSource = Buffer.concat(buffers);
            gltf.buffers[index] = {
                name: mergedName,
                byteLength: mergedSource.byteLength,
                extras: {
                    _pipeline: {
                        source: mergedSource
                    }
                }
            };
        }
    }

    return gltf;
}

function allocateBufferPadding(byteLength) {
    var alignment = byteLength & 3;
    if (alignment > 0) {
        var bytesToPad = 4 - alignment;
        return Buffer.alloc(bytesToPad);
    }
    return Buffer.alloc(0);
}
