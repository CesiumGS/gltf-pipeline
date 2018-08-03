'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var addToArray = require('./addToArray');
var hasExtension = require('./hasExtension.js');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} defaultName The default name of the buffer data files.
 * @param {Boolean} uncompressedFallback If set split up the buffers into uncompressed meshes, compressed meshes, and non-meshes. If not set merge all buffers into one buffer.
 * @returns {Object} The glTF asset with its buffers merged.
 *
 * @private
 */
function mergeBuffers(gltf, defaultName, uncompressedFallback) {
    var baseBufferName = defaultName;
    ForEach.buffer(gltf, function(buffer) {
        baseBufferName = defaultValue(buffer.name, baseBufferName);
    });

    var bufferList = getBufferList(gltf, baseBufferName, uncompressedFallback);

    // Add array of Buffers to merge.
    for (var i = 0; i < bufferList.length; ++i) {
        bufferList[i].buffersToMerge = [];
        bufferList[i].lengthSoFar = 0;
        bufferList[i].bufferId = i;
    }

    var bufferViewId = -1;
    ForEach.bufferView(gltf, function(bufferView) {
        ++bufferViewId;

        if (defined(gltf.buffers[bufferView.buffer])) {
            // Get new buffer
            var newBuffer = bufferList[0];

            // Check if the bufferView should be associated with a different buffer.
            for (var j = 1; j < bufferList.length; ++j) {
                if (defined(bufferList[j].bufferViews)) {
                    if (bufferList[j].bufferViews[bufferViewId]) {
                        newBuffer = bufferList[j];
                        break;
                    }
                }
            }

            // Check if we need to add padding beofre we add data to the buffer.
            var bufferViewPadding = getPadding(newBuffer.lengthSoFar);
            addToArray(newBuffer.buffersToMerge, bufferViewPadding);
            newBuffer.lengthSoFar += bufferViewPadding.length;

            var buffer = gltf.buffers[bufferView.buffer];
            var sourceBufferViewData = Buffer.from(buffer.extras._pipeline.source.slice(bufferView.byteOffset,
                bufferView.byteOffset + bufferView.byteLength));

            // Copy the data from the source buffer to new buffer.
            bufferView.byteOffset = newBuffer.lengthSoFar;
            bufferView.buffer = newBuffer.bufferId;

            addToArray(newBuffer.buffersToMerge, sourceBufferViewData);
            newBuffer.lengthSoFar += sourceBufferViewData.length;
        }
    });

    // Clear the current buffers.
    gltf.buffers = [];

    for (var k = 0; k < bufferList.length; ++k) {
        var newBuffer = bufferList[k];

        var bufferPadding = getPadding(newBuffer.lengthSoFar);
        addToArray(newBuffer.buffersToMerge, bufferPadding);
        var mergedSource = Buffer.concat(newBuffer.buffersToMerge);

        var bufferElement = {
            name: newBuffer.name,
            byteLength: mergedSource.length,
            extras: {
                _pipeline: {
                    source: mergedSource
                }
            }
        };
        addToArray(gltf.buffers, bufferElement);
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

function getBufferList(gltf, baseBufferName, uncompressedFallback) {
    var bufferList = [];
    if (uncompressedFallback) {
        bufferList = getBufferListWithFallback(gltf, baseBufferName);
    } else {
        // Only one buffer is needed.
        var newBufferElement = {
            name: baseBufferName
        };
        bufferList = [];
        addToArray(bufferList, newBufferElement);
    }
    return bufferList;
}

function getBufferListWithFallback(gltf, baseBufferName) {
    var uncompressedMeshBufferViewIds = {};
    var compressedMeshBufferViewIds = {};
    var nonMeshBufferViewIds = {};
    var meshBufferViewIds = {};

    // Figure out which bufferViews are associated with compressed and
    // uncompressed data.
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId) {
                var accessor = gltf.accessors[accessorId];
                if (defined(accessor.bufferView)) {
                    uncompressedMeshBufferViewIds[accessor.bufferView] = true;
                    meshBufferViewIds.uncompressed = uncompressedMeshBufferViewIds;
                }
            });
            ForEach.meshPrimitiveTarget(primitive, function(target) {
                ForEach.meshPrimitiveTargetAttribute(target, function(accessorId) {
                    var accessor = gltf.accessors[accessorId];
                    if (defined(accessor.bufferView)) {
                        uncompressedMeshBufferViewIds[accessor.bufferView] = true;
                        meshBufferViewIds.uncompressed = uncompressedMeshBufferViewIds;
                    }
                });
            });
            var indices = primitive.indices;
            if (defined(indices)) {
                var accessor = gltf.accessors[indices];
                if (defined(accessor.bufferView)) {
                    uncompressedMeshBufferViewIds[accessor.bufferView] = true;
                    meshBufferViewIds.uncompressed = uncompressedMeshBufferViewIds;
                }
            }
            if (hasExtension(gltf, 'KHR_draco_mesh_compression')) {
                if (defined(primitive.extensions) &&
                    defined(primitive.extensions.KHR_draco_mesh_compression)) {
                    compressedMeshBufferViewIds[primitive.extensions.KHR_draco_mesh_compression.bufferView] = true;
                    meshBufferViewIds.compressed = compressedMeshBufferViewIds;
                }
            }
        });
    });

    var bufferViewId = -1;
    ForEach.bufferView(gltf, function(bufferView) { // eslint-disable-line no-unused-vars
        ++bufferViewId;

        if (!uncompressedMeshBufferViewIds[bufferViewId] && !compressedMeshBufferViewIds[bufferViewId]) {
            // The Buffer View is for non-mesh data.
            nonMeshBufferViewIds[bufferViewId] = true;
            meshBufferViewIds.nonMesh = nonMeshBufferViewIds;
        }
    });

    var newBufferList = [];
    if (defined(meshBufferViewIds.uncompressed)) {
        var newBufferUncompressed = {
            name: baseBufferName + '-uncompressed',
            bufferViews: meshBufferViewIds.uncompressed
        };
        addToArray(newBufferList, newBufferUncompressed);
    }
    if (defined(meshBufferViewIds.compressed)) {
        var newBufferCompressed = {
            name: baseBufferName + '-draco',
            bufferViews: meshBufferViewIds.compressed
        };
        addToArray(newBufferList, newBufferCompressed);
    }
    if (defined(meshBufferViewIds.nonMesh)) {
        var newBufferNonMesh = {
            name: baseBufferName,
            bufferViews: meshBufferViewIds.nonMesh
        };
        addToArray(newBufferList, newBufferNonMesh);
    }
    return newBufferList;
}
