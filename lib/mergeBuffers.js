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

    var placeholderName = 'other-buffers';

    var buffersToMerge = {};

    ForEach.bufferView(gltf, function(bufferView) {
        var buffer = gltf.buffers[bufferView.buffer];
        var mergedName = buffer.extras._pipeline.mergedBufferName;
        if (defined(baseBufferName) && defined(mergedName)) {
            mergedName = baseBufferName + '-' + mergedName;
        } else {
            mergedName = defaultValue(defaultValue(mergedName, baseBufferName), placeholderName);
        }
        if (!defined(buffersToMerge[mergedName])) {
            buffersToMerge[mergedName] = {
                buffers: [],
                length: 0,
                index: Object.keys(buffersToMerge).length
            };
        }
        var buffers = buffersToMerge[mergedName].buffers;
        var length = buffersToMerge[mergedName].length;
        var index = buffersToMerge[mergedName].index;

        var sourceBufferViewData = Buffer.from(buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength));
        var bufferViewPadding = getPadding(length);
        buffers.push(bufferViewPadding);
        length += bufferViewPadding.length;

        bufferView.byteOffset = length;
        bufferView.buffer = index;

        buffers.push(sourceBufferViewData);
        length += sourceBufferViewData.length;

        buffersToMerge[mergedName].length = length;
    });

    var buffersLength = Object.keys(buffersToMerge).length;
    gltf.buffers = new Array(buffersLength);

    for (var mergedName in buffersToMerge) {
        if (buffersToMerge.hasOwnProperty(mergedName)) {
            var buffers = buffersToMerge[mergedName].buffers;
            var length = buffersToMerge[mergedName].length;
            var index = buffersToMerge[mergedName].index;
            var bufferPadding = getPadding(length);
            buffers.push(bufferPadding);
            var mergedSource = Buffer.concat(buffers);
            var name = mergedName === placeholderName ? undefined : mergedName;
            gltf.buffers[index] = {
                name: name,
                byteLength: mergedSource.length,
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

function getPadding(length) {
    var alignment = length & 3;
    if (alignment > 0) {
        var bytesToPad = 4 - alignment;
        return Buffer.alloc(bytesToPad);
    }
    return Buffer.alloc(0);
}
