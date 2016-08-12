'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = mergeBuffers;

//Merge all buffers into one buffer
function mergeBuffers(gltf, bufferName) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

    if (defined(buffers)) {
        var source = new Buffer(0);
        var bufferOffsets = {};
        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                //Add the buffer to the merged source
                var buffer = buffers[bufferId];
                bufferOffsets[bufferId] = source.length;
                source = Buffer.concat([source, buffer.extras._pipeline.source]);
            }
        }
        for (var bufferViewId in bufferViews) {
            if (bufferViews.hasOwnProperty(bufferViewId)) {
                var bufferView = bufferViews[bufferViewId];
                bufferView.byteOffset = bufferView.byteOffset + bufferOffsets[bufferView.buffer];
                bufferView.buffer = bufferName;
            }
        }

        //Replace existing buffer with new merged buffer
        gltf.buffers = {};
        gltf.buffers[bufferName] = {
            "type": "arraybuffer",
            "byteLength": source.length,
            "uri": "data:,",
            "extras": {
                "_pipeline": {
                    "source": source,
                    "extension": ".bin",
                    "deleteExtras": true
                }
            }
        };
    }

    return gltf;
}