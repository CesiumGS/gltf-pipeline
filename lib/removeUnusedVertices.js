/*jshint loopfunc: true */
'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var WebGLConstants = Cesium.WebGLConstants;
var objectValues = require('object-values');

module.exports = removeUnusedVertices;

//Removes sections of buffers which are unreferenced by buffer views and accessors.
function removeUnusedVertices(gltf) {
    if (defined(gltf.accessors) && defined(gltf.buffers) && defined(gltf.bufferViews) && defined(gltf.meshes)) {
        removeUnusedBufferData(gltf);
        removeUnusedIndexData(gltf);
    }

    return gltf;
}

//Removes sections of buffers which are not referenced by buffer views and updates its corresponding buffer views.
function removeUnusedBufferData(gltf) {
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

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
    for (var bufferId in buffers) {
        if (buffers.hasOwnProperty(bufferId)) {
            var buffer = buffers[bufferId];
            if (!defined(buffer.extras._pipeline.offset)) {
                delete buffers[bufferId];
            }
            else {
                buffer.extras._pipeline.source = buffer.extras._pipeline.source.slice(0, buffer.extras._pipeline.end - buffer.extras._pipeline.offset);
                buffer.byteLength = buffer.extras._pipeline.source.length;
                delete buffer.extras._pipeline.offset;
                delete buffer.extras._pipeline.end;
            }
        }
    }
}

//Remove sections of buffers which are not accessed by indices.
function removeUnusedIndexData(gltf) {
    var accessors = gltf.accessors;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var meshes = gltf.meshes;

    var primitives = [];
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            if (defined(meshes[meshId].primitives)) {
                primitives.push.apply(primitives, meshes[meshId].primitives);
            }
        }
    }
    calculateIndexIntervals(accessors, bufferViews, buffers, primitives);

    compressBuffers(accessors, bufferViews, buffers);

    //Recalculate the byte length for each buffer.
    for (var bufferId in buffers) {
        if (buffers.hasOwnProperty(bufferId)) {
            var buffer = buffers[bufferId];
            if (defined(buffer.extras._pipeline.offset)) {
                buffer.byteLength = buffer.extras._pipeline.source.length;
            }
        }
    }
    
    updateIndices(bufferViews, buffers);
}

//Calculate the range of indices used by primitives and their accessors.
function calculateIndexIntervals(accessors, bufferViews, buffers, primitives) {
    for (var bufferViewId in bufferViews) {
        if (bufferViews.hasOwnProperty(bufferViewId)) {
            bufferViews[bufferViewId].extras._pipeline.accessors = {};
        }
    }

    for (var i = 0; i < primitives.length; i++) {
        var primitive = primitives[i];
        if (defined(primitive.indices)) {
            var indexAccessor = accessors[primitive.indices];
            var indexView = bufferViews[indexAccessor.bufferView];
            var indexBuffer = buffers[indexView.buffer];
            var indexSource = indexBuffer.extras._pipeline.source.slice(indexView.byteOffset, indexView.byteOffset + defaultValue(indexView.byteLength, 0));
            var indexStride = indexAccessor.componentType === WebGLConstants.UNSIGNED_SHORT ? 2 : 1;
            indexView.extras._pipeline.indexStride = defaultValue(indexView.extras._pipeline.indexStride, indexStride);
            indexView.extras._pipeline.indexIntervals = defaultValue(indexView.extras._pipeline.indexIntervals, []);

            //Create a sorted array of unique index values.
            var indexArray = [];
            var accessorSource = indexSource.slice(indexAccessor.byteOffset, indexAccessor.byteOffset + indexStride * indexAccessor.count);
            var accessorIndex = 0;
            while (accessorIndex < accessorSource.length) {
                var index = WebGLConstants.UNSIGNED_SHORT ? accessorSource.readUInt16LE(accessorIndex) : accessorSource.readUInt8LE(accessorIndex);
                if (indexArray.indexOf(index) === -1) {
                    indexArray.push(index);
                }
                accessorIndex += indexStride;
            }
            indexArray.sort(function(a, b) {
                return a - b;
            });

            //Calculate the index intervals based on the array of sorted indices.
            var indexIntervals = [];
            var intervalStart, prevIndex;
            var newAccessorCount = 0;

            for (var j = 0; j < indexArray.length; j++) {
                var currentIndex = indexArray[j];

                var pushInterval = function(start, end) {
                    var interval = [start, end];
                    indexIntervals.push(interval);
                    indexView.extras._pipeline.indexIntervals.push(interval);
                    newAccessorCount += interval[1] - interval[0] + 1;
                };
                if (currentIndex !== prevIndex + 1) {
                    if (j > 0) {
                        //If the current index is not part of the current interval, start a new interval.
                        pushInterval(intervalStart, prevIndex);
                    }
                    intervalStart = currentIndex;
                }
                if (j === indexArray.length - 1) {
                    pushInterval(intervalStart, currentIndex);
                }

                prevIndex = currentIndex;
            }

            //Calculate the indexIntervals of the attributes relative to their corresponding buffer views based on their byte stride.
            var attributes = primitive.attributes;
            for (var attributeId in attributes) {
                if (attributes.hasOwnProperty(attributeId)) {
                    var attributeAccessor = accessors[attributes[attributeId]];
                    var attributeView = bufferViews[attributeAccessor.bufferView];

                    if (Object.keys(attributeView.extras._pipeline.accessors).indexOf(attributes[attributeId]) === -1) {
                        var attributeStride = 1;
                        if (attributeAccessor.byteStride > 0) {
                            attributeStride = attributeAccessor.byteStride;
                        }
                        else {
                            //Int16
                            if (attributeAccessor.componentType === WebGLConstants.SHORT || attributeAccessor.componentType === WebGLConstants.UNSIGNED_SHORT) {
                                attributeStride = 2;
                            }
                            //Float32
                            if (attributeAccessor.componentType === WebGLConstants.FLOAT) {
                                attributeStride = 4;
                            }
                        }

                        var attributeIntervals = indexIntervals.slice();
                        for (var k = 0; k < attributeIntervals.length; k++) {
                            var attributeInterval = attributeIntervals[k];
                            var viewStart = attributeAccessor.byteOffset + attributeInterval[0] * attributeStride;
                            var intervalLength = attributeInterval[1] - attributeInterval[0] + 1;
                            attributeIntervals[k] = [viewStart, (viewStart + intervalLength * attributeStride) - 1];

                        }
                        attributeView.extras._pipeline.accessors[attributes[attributeId]] = attributeIntervals;

                        if (!defined(attributeAccessor.extras._pipeline.byteLength)) {
                            attributeAccessor.extras._pipeline.originalByteLength = attributeStride * attributeAccessor.count;
                        }
                        attributeAccessor.count = newAccessorCount;
                    }
                }
            }
        }
    }
}

//Go through the index intervals for each buffer view and remove unused sections from the corresponding buffers.
function compressBuffers(accessors, bufferViews, buffers) {
    //Process the buffer views in order based on their byte offset.
    var sortedBufferViews = objectValues(bufferViews);
    sortedBufferViews.sort(function(a, b) {
        return a.byteOffset - b.byteOffset;
    });
    for (var i = 0; i < sortedBufferViews.length; i++) {
        var bufferView = sortedBufferViews[i];
        var accessorIds = Object.keys(bufferView.extras._pipeline.accessors);
        if (Object.keys(accessorIds).length > 0) {
            bufferView.extras._pipeline.offset = 0;
            var viewedBuffer = buffers[bufferView.buffer];
            var source = viewedBuffer.extras._pipeline.source;
            var originalBufferOffset = defaultValue(viewedBuffer.extras._pipeline.offset, 0);
            var originalViewEnd = bufferView.byteOffset + defaultValue(bufferView.byteLength, 0);

            //Sort the accessors of the buffer view by their byte offset.
            accessorIds.sort(function(a, b) {
                return accessors[a].byteOffset - accessors[b].byteOffset;
            });
            //Reset the buffer view byte length to be recalculated as we process the accessors.
            bufferView.byteLength = 0;

            //Examine the intervals used by each accessor and remove sections from the buffer as gaps between intervals are encountered.
            var previousEnd = 0;
            for (var j = 0; j < accessorIds.length; j++) {
                var viewAccessor = accessors[accessorIds[j]];
                viewAccessor.byteOffset -= bufferView.extras._pipeline.offset;
                var accessorIntervals = bufferView.extras._pipeline.accessors[accessorIds[j]];
                var newAccessorLength = 0;
                for (var k = 0; k < accessorIntervals.length; k++) {
                    var accessorInterval = accessorIntervals[k];
                    var gap = accessorInterval[0] - previousEnd;
                    previousEnd = accessorInterval[1] + 1;

                    var accessorStart = accessorInterval[0] + bufferView.byteOffset;
                    var accessorLength = accessorInterval[1] - accessorInterval[0] + 1;
                    var accessorEnd = accessorStart + accessorLength;

                    var removeBufferSection = function(start, end) {
                        source = Buffer.concat([source.slice(0, start), source.slice(end)]);
                        viewedBuffer.extras._pipeline.source = source;
                    };

                    if (k === 0) {
                        if (!defined(viewedBuffer.extras._pipeline.offset)) {
                            viewedBuffer.extras._pipeline.offset = accessorInterval[0];
                            if (accessorStart > bufferView.byteOffset) {
                                removeBufferSection(bufferView.byteOffset, accessorStart);
                            }
                        }
                        else {
                            viewedBuffer.extras._pipeline.offset += gap;
                            removeBufferSection(accessorStart - viewedBuffer.extras._pipeline.offset, accessorStart + gap - viewedBuffer.extras._pipeline.offset);
                        }
                    }
                    else {
                        if (gap > 0) {
                            removeBufferSection(viewedBuffer.extras._pipeline.end - viewedBuffer.extras._pipeline.offset, accessorStart - viewedBuffer.extras._pipeline.offset);
                            viewedBuffer.extras._pipeline.offset += gap;    
                        }
                    }

                    viewedBuffer.extras._pipeline.end = accessorEnd;
                    newAccessorLength += accessorLength;
                }

                //Calculate the new byte length and compare the new and original accessor lengths to find the number of indices removed, adding it to the offset.
                bufferView.extras._pipeline.offset += viewAccessor.extras._pipeline.originalByteLength - newAccessorLength;
                bufferView.byteLength += newAccessorLength;
            }

            //Remove the end the buffer view if it not used.
            source = Buffer.concat([source.slice(0, viewedBuffer.extras._pipeline.end - viewedBuffer.extras._pipeline.offset), 
                source.slice(originalViewEnd - viewedBuffer.extras._pipeline.offset)]);
            viewedBuffer.extras._pipeline.source = source;
            viewedBuffer.extras._pipeline.offset += originalViewEnd - viewedBuffer.extras._pipeline.end;   

            bufferView.byteOffset -= originalBufferOffset;
        }
    }
}

//Update the accessed index values based on the offset from the corresponding indexIntervals.
function updateIndices(bufferViews, buffers) {
    for (var bufferViewId in bufferViews) {
        if (bufferViews.hasOwnProperty(bufferViewId)) {
            var bufferView = bufferViews[bufferViewId];
            if (defined(bufferView.extras._pipeline.indexIntervals)) {
                var buffer = buffers[bufferView.buffer];
                var indexSource = buffer.extras._pipeline.source;
                var indexIntervals = bufferView.extras._pipeline.indexIntervals;

                //Sort the intervals by their start index.
                indexIntervals.sort(function(a, b) {
                    return a[0] - b[0];
                });

                //If the current interval overlaps with the previous interval, merge the two.
                var previousInterval = indexIntervals[0];
                for (var i = 1; i < indexIntervals.length; i++) {
                    var currentInterval = indexIntervals[i];
                    if (currentInterval[0] <= previousInterval[1] + 1) {
                        previousInterval[1] = currentInterval[1];
                        indexIntervals.splice(i, 1);
                        i--;
                    }
                    else {
                        previousInterval = currentInterval;
                    }
                }

                //Create an array storing interval start values and the offset for indices within that interval.                
                var offsetArray = [];
                var totalOffset = indexIntervals[0][0];
                offsetArray.push([indexIntervals[0][0], indexIntervals[0][0]]);
                for (var j = 1; j < indexIntervals.length; j++) {
                    var gap = indexIntervals[j][0] - (indexIntervals[j-1][1] + 1);
                    totalOffset += gap;
                    offsetArray.push([indexIntervals[j][0], totalOffset]);
                }

                //For each index in the buffer view, offset it based on the relevant interval in the offset array.
                var sourceIndex = bufferView.byteOffset;
                var viewEnd = bufferView.byteOffset + bufferView.byteLength;
                var indexStride = bufferView.extras._pipeline.indexStride;
                while (sourceIndex < viewEnd) {
                    var index = (indexStride === 2) ? indexSource.readUInt16LE(sourceIndex) : indexSource.readUInt8LE(sourceIndex);
                    for (var k = offsetArray.length - 1; k >= 0; k--) {
                        if (index >= offsetArray[k][0]) {
                            if (indexStride === 2) {
                                indexSource.writeUInt16LE(index - offsetArray[k][1], sourceIndex);
                            }
                            else {
                                indexSource.writeUInt8LE(index - offsetArray[k][1], sourceIndex);
                            }
                            break;
                        }
                    }
                    sourceIndex += indexStride;
                }
            }
        }
    }
}