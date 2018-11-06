'use strict';
const Cesium = require('cesium');
const ForEach = require('./ForEach');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

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
    let baseBufferName = defaultName;
    ForEach.buffer(gltf, function(buffer) {
        baseBufferName = defaultValue(buffer.name, baseBufferName);
    });
    baseBufferName = defaultValue(baseBufferName, 'buffer');

    const buffersToMerge = {};

    ForEach.bufferView(gltf, function(bufferView) {
        const buffer = gltf.buffers[bufferView.buffer];
        let mergedName = buffer.extras._pipeline.mergedBufferName;
        mergedName = defined(mergedName) ? baseBufferName + '-' + mergedName : baseBufferName;
        if (!defined(buffersToMerge[mergedName])) {
            buffersToMerge[mergedName] = {
                buffers: [],
                byteLength: 0,
                index: Object.keys(buffersToMerge).length
            };
        }
        const buffers = buffersToMerge[mergedName].buffers;
        let byteLength = buffersToMerge[mergedName].byteLength;
        const index = buffersToMerge[mergedName].index;

        const sourceBufferViewData = Buffer.from(buffer.extras._pipeline.source.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength));
        const bufferViewPadding = allocateBufferPadding(byteLength);
        buffers.push(bufferViewPadding);
        byteLength += bufferViewPadding.byteLength;

        bufferView.byteOffset = byteLength;
        bufferView.buffer = index;

        buffers.push(sourceBufferViewData);
        byteLength += sourceBufferViewData.byteLength;

        buffersToMerge[mergedName].byteLength = byteLength;
    });

    const buffersLength = Object.keys(buffersToMerge).length;
    gltf.buffers = new Array(buffersLength);

    for (const mergedName in buffersToMerge) {
        if (buffersToMerge.hasOwnProperty(mergedName)) {
            const buffers = buffersToMerge[mergedName].buffers;
            const byteLength = buffersToMerge[mergedName].byteLength;
            const index = buffersToMerge[mergedName].index;
            const bufferPadding = allocateBufferPadding(byteLength);
            buffers.push(bufferPadding);
            const mergedSource = Buffer.concat(buffers);
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
    const alignment = byteLength & 3;
    if (alignment > 0) {
        const bytesToPad = 4 - alignment;
        return Buffer.alloc(bytesToPad);
    }
    return Buffer.alloc(0);
}
