"use strict";
const FS_WRITE_MAX_LENGTH = 2147479552; // See https://github.com/nodejs/node/issues/35605
const BUFFER_MAX_LENGTH = require("buffer").constants.MAX_LENGTH;
const BUFFER_MAX_BYTE_LENGTH = Math.min(FS_WRITE_MAX_LENGTH, BUFFER_MAX_LENGTH);
const Cesium = require("cesium");
const ForEach = require("./ForEach");

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = mergeBuffers;

/**
 * Merge all buffers. Buffers with the same extras._pipeline.mergedBufferName will be merged together.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} [defaultName] The default name of the buffer data files.
 * @param {Boolean} [force=false] Whether to force merging all buffers.
 * @returns {Object} The glTF asset with its buffers merged.
 *
 * @private
 */
function mergeBuffers(gltf, defaultName, force) {
  let baseBufferName = defaultName;
  if (!defined(baseBufferName)) {
    ForEach.buffer(gltf, function (buffer) {
      baseBufferName = defaultValue(baseBufferName, buffer.name);
    });
    baseBufferName = defaultValue(baseBufferName, "buffer");
  }

  let buffersByteLength = 0;
  const emptyBuffers = [];
  const emptyBufferIds = [];

  ForEach.buffer(gltf, function (buffer, bufferId) {
    const source = buffer.extras._pipeline.source;
    if (defined(source)) {
      buffersByteLength += source.length;
    } else {
      emptyBuffers.push(buffer);
      emptyBufferIds.push(bufferId);
    }

    const extensions = defaultValue(
      buffer.extensions,
      defaultValue.EMPTY_OBJECT
    );
    const meshoptObject = extensions.EXT_meshopt_compression;
    if (defined(meshoptObject) && meshoptObject.fallback) {
      // Prevent empty meshopt buffer from being merged into main buffer
      buffer.extras._pipeline.mergedBufferName = `meshopt-fallback-${bufferId}`;
    }
  });

  // Don't merge buffers if the merged buffer will exceed the Node limit.
  const splitBuffers =
    buffersByteLength > mergeBuffers._getBufferMaxByteLength();

  const buffersToMerge = {};
  const mergedNameCount = {};

  forEachBufferViewLikeObject(gltf, function (bufferView) {
    const buffer = gltf.buffers[bufferView.buffer];
    const source = buffer.extras._pipeline.source;
    if (!defined(source)) {
      return;
    }

    let mergedName = buffer.extras._pipeline.mergedBufferName;
    mergedName = defined(mergedName)
      ? `${baseBufferName}-${mergedName}`
      : baseBufferName;

    if (splitBuffers) {
      if (!defined(mergedNameCount[mergedName])) {
        mergedNameCount[mergedName] = 0;
      }
      mergedName += `-${mergedNameCount[mergedName]++}`;
    }

    if (force) {
      mergedName = baseBufferName;
    }

    if (!defined(buffersToMerge[mergedName])) {
      buffersToMerge[mergedName] = {
        buffers: [],
        byteLength: 0,
        index: Object.keys(buffersToMerge).length,
      };
    }
    const buffers = buffersToMerge[mergedName].buffers;
    let byteLength = buffersToMerge[mergedName].byteLength;
    const index = buffersToMerge[mergedName].index;

    const sourceBufferViewData = Buffer.from(
      source.slice(
        bufferView.byteOffset,
        bufferView.byteOffset + bufferView.byteLength
      )
    );
    const bufferViewPadding = allocateBufferPadding(byteLength);
    if (defined(bufferViewPadding)) {
      buffers.push(bufferViewPadding);
      byteLength += bufferViewPadding.byteLength;
    }

    bufferView.byteOffset = byteLength;
    bufferView.buffer = index;

    buffers.push(sourceBufferViewData);
    byteLength += sourceBufferViewData.byteLength;

    buffersToMerge[mergedName].byteLength = byteLength;
  });

  const buffersLength = Object.keys(buffersToMerge).length;
  gltf.buffers = new Array(buffersLength);

  for (const mergedName in buffersToMerge) {
    if (Object.prototype.hasOwnProperty.call(buffersToMerge, mergedName)) {
      const buffers = buffersToMerge[mergedName].buffers;
      const byteLength = buffersToMerge[mergedName].byteLength;
      const index = buffersToMerge[mergedName].index;
      const bufferPadding = allocateBufferPadding(byteLength);
      if (defined(bufferPadding)) {
        buffers.push(bufferPadding);
      }
      const mergedSource =
        buffers.length > 1 ? Buffer.concat(buffers) : buffers[0];
      gltf.buffers[index] = {
        name: mergedName,
        byteLength: mergedSource.byteLength,
        extras: {
          _pipeline: {
            source: mergedSource,
          },
        },
      };
    }
  }

  const emptyBuffersLength = emptyBuffers.length;
  for (let i = 0; i < emptyBuffersLength; ++i) {
    const emptyBuffer = emptyBuffers[i];
    const emptyBufferId = emptyBufferIds[i];
    const newBufferId = gltf.buffers.length;
    forEachBufferViewLikeObject(gltf, function (bufferView) {
      if (bufferView.buffer === emptyBufferId) {
        bufferView.buffer = newBufferId;
      }
    });
    gltf.buffers.push(emptyBuffer);
  }

  return gltf;
}

function forEachBufferViewLikeObject(gltf, callback) {
  ForEach.bufferView(gltf, function (bufferView) {
    callback(bufferView);

    const extensions = defaultValue(
      bufferView.extensions,
      defaultValue.EMPTY_OBJECT
    );
    const meshoptObject = extensions.EXT_meshopt_compression;
    if (defined(meshoptObject)) {
      // The EXT_meshopt_compression object has buffer, byteOffset, and byteLength properties like a bufferView
      callback(meshoptObject);
    }
  });
}

function allocateBufferPadding(byteLength) {
  const boundary = 8;
  const remainder = byteLength % boundary;
  const padding = remainder === 0 ? 0 : boundary - remainder;
  if (padding > 0) {
    return Buffer.alloc(padding);
  }
  return undefined;
}

// Exposed for testing
mergeBuffers._getBufferMaxByteLength = function () {
  return BUFFER_MAX_BYTE_LENGTH;
};
