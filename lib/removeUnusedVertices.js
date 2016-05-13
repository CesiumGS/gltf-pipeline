'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var objectValues = require('object-values');

module.exports = removeUnusedVertices;

//Removes unreferenced sections of buffers and updates their corresponding buffer views.
function removeUnusedVertices(gltf) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

    if (defined(bufferViews)) {
        //Create and traverse an array of buffer views sorted by increasing byteOffset
        var sortedBufferViews = objectValues(bufferViews);
        sortedBufferViews.sort(function(a, b) {
            return a.byteOffset - b.byteOffset;
        });

        for (var i = 0; i < sortedBufferViews.length; i++) {
            var bufferView = sortedBufferViews[i];
            var viewedBuffer = buffers[bufferView.buffer];
            var source = viewedBuffer.extras._pipeline.source;
            var viewStart = bufferView.byteOffset;
            var viewLength = defaultValue(bufferView.byteLength, 0);
            var viewEnd = viewStart + viewLength;

            //While processing the buffer views, store the accumulated length of deleted portions of referenced buffers in the offset extra
            //The end extra property denotes the largest index in the buffer referenced thus far by buffer views.
            if (!defined(viewedBuffer.extras._pipeline.offset)) {
                viewedBuffer.extras._pipeline.offset = viewStart;
                viewedBuffer.extras._pipeline.end = viewStart + viewLength;
                if (viewStart > 0) {
                    bufferView.byteOffset = 0;
                    viewedBuffer.extras._pipeline.source = source.slice(viewStart);
                }
            }
            else {
                if (viewStart > viewedBuffer.extras._pipeline.end) {
                    viewedBuffer.extras._pipeline.source = Buffer.concat([source.slice(0, viewedBuffer.extras._pipeline.end - viewedBuffer.extras._pipeline.offset), 
                        source.slice(viewStart - viewedBuffer.extras._pipeline.offset)]);
                    viewedBuffer.extras._pipeline.offset += viewStart - viewedBuffer.extras._pipeline.end;
                }
                bufferView.byteOffset -= viewedBuffer.extras._pipeline.offset;

                if (viewEnd > viewedBuffer.extras._pipeline.end) {
                    viewedBuffer.extras._pipeline.end = viewEnd;
                }
            }
        }

        //Update the buffers based on their new source, offset, and end. The buffer will be deleted if it was never referenced.
        if (defined(buffers)) {
            for (var bufferId in buffers) {
                if (buffers.hasOwnProperty(bufferId)) {
                    var buffer = buffers[bufferId];
                    if (!defined(buffer.extras._pipeline.offset)) {
                        delete buffers[bufferId];
                    }
                    else {
                        buffer.extras._pipeline.source = buffer.extras._pipeline.source.slice(0, buffer.extras._pipeline.end - buffer.extras._pipeline.offset);
                        buffer.byteLength = buffer.extras._pipeline.source.length;
                    }
                }
            }
        }
    }

    return gltf;
}