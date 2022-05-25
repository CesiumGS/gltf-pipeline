"use strict";
const Cesium = require("cesium");
const ForEach = require("./ForEach");

const defined = Cesium.defined;
const isDataUri = Cesium.isDataUri;
const WebGLConstants = Cesium.WebGLConstants;

module.exports = getStatistics;

/**
 * Returns an object containing the statistics for the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Number} [nodeId] If defined, statistics will only process number of draw calls and rendered primitives for the specified node.
 * @returns {Statistics} Object containing the statistics of the glTF asset.
 *
 * @see Statistics
 */
function getStatistics(gltf, nodeId) {
  const statistics = new Statistics();

  if (defined(nodeId)) {
    const nodeDrawStats = getDrawCallStatisticsForNode(gltf, nodeId);
    statistics.numberOfDrawCalls = nodeDrawStats.numberOfDrawCalls;
    statistics.numberOfRenderedPrimitives =
      nodeDrawStats.numberOfRenderedPrimitives;
    return statistics;
  }

  const drawStats = getDrawCallStatistics(gltf);

  statistics.buffersByteLength = getBuffersByteLength(gltf);
  statistics.numberOfImages = defined(gltf.images) ? gltf.images.length : 0;
  statistics.numberOfExternalRequests = getNumberOfExternalRequests(gltf);
  statistics.numberOfDrawCalls = drawStats.numberOfDrawCalls;
  statistics.numberOfRenderedPrimitives = drawStats.numberOfRenderedPrimitives;
  statistics.numberOfNodes = defined(gltf.nodes) ? gltf.nodes.length : 0;
  statistics.numberOfMeshes = defined(gltf.meshes) ? gltf.meshes.length : 0;
  statistics.numberOfMaterials = defined(gltf.materials)
    ? gltf.materials.length
    : 0;
  statistics.numberOfAnimations = defined(gltf.animations)
    ? gltf.animations.length
    : 0;

  return statistics;
}

function getBuffersByteLength(gltf) {
  let byteLength = 0;
  ForEach.buffer(gltf, function (buffer) {
    byteLength += buffer.byteLength;
  });
  return byteLength;
}

function getNumberOfExternalRequests(gltf) {
  let count = 0;
  ForEach.buffer(gltf, function (buffer) {
    if (defined(buffer.uri) && !isDataUri(buffer.uri)) {
      count++;
    }
  });
  ForEach.image(gltf, function (image) {
    if (defined(image.uri) && !isDataUri(image.uri)) {
      count++;
    }
  });
  ForEach.shader(gltf, function (shader) {
    if (defined(shader.uri) && !isDataUri(shader.uri)) {
      count++;
    }
  });
  return count;
}

function getNumberOfRenderedPrimitives(gltf, primitive) {
  let count = 0;
  if (defined(primitive.indices)) {
    count = gltf.accessors[primitive.indices].count;
  } else if (defined(primitive.attributes.POSITION)) {
    count = gltf.accessors[primitive.attributes.POSITION].count;
  }
  switch (primitive.mode) {
    case WebGLConstants.POINTS:
      return count;
    case WebGLConstants.LINES:
      return count / 2;
    case WebGLConstants.LINE_LOOP:
      return count;
    case WebGLConstants.LINE_STRIP:
      return Math.max(count - 1, 0);
    case WebGLConstants.TRIANGLES:
      return count / 3;
    case WebGLConstants.TRIANGLE_STRIP:
    case WebGLConstants.TRIANGLE_FAN:
      return Math.max(count - 2, 0);
    default:
      // TRIANGLES
      return count / 3;
  }
}

function getDrawCallStatisticsForNode(gltf, nodeId) {
  let numberOfDrawCalls = 0;
  let numberOfRenderedPrimitives = 0;

  ForEach.nodeInTree(gltf, [nodeId], function (node) {
    const mesh = gltf.meshes[node.mesh];
    if (defined(mesh)) {
      ForEach.meshPrimitive(mesh, function (primitive) {
        numberOfDrawCalls++;
        numberOfRenderedPrimitives += getNumberOfRenderedPrimitives(
          gltf,
          primitive
        );
      });
    }
  });

  return {
    numberOfDrawCalls: numberOfDrawCalls,
    numberOfRenderedPrimitives: numberOfRenderedPrimitives,
  };
}

function getDrawCallStatistics(gltf) {
  let numberOfDrawCalls = 0;
  let numberOfRenderedPrimitives = 0;

  ForEach.mesh(gltf, function (mesh) {
    ForEach.meshPrimitive(mesh, function (primitive) {
      numberOfDrawCalls++;
      numberOfRenderedPrimitives += getNumberOfRenderedPrimitives(
        gltf,
        primitive
      );
    });
  });

  return {
    numberOfDrawCalls: numberOfDrawCalls,
    numberOfRenderedPrimitives: numberOfRenderedPrimitives,
  };
}

/**
 * Contains statistics for a glTF asset.
 *
 * @property {Number} buffersByteLength The total byte length of all buffers.
 * @property {Number} numberOfImages The number of images in the asset.
 * @property {Number} numberOfExternalRequests The number of external requests required to fetch the asset data.
 * @property {Number} numberOfDrawCalls The number of draw calls required to render the asset.
 * @property {Number} numberOfRenderedPrimitives The total number of rendered primitives in the asset (e.g. triangles).
 * @property {Number} numberOfNodes The total number of nodes in the asset.
 * @property {Number} numberOfMeshes The total number of meshes in the asset.
 * @property {Number} numberOfMaterials The total number of materials in the asset.
 * @property {Number} numberOfAnimations The total number of animations in the asset.
 *
 * @constructor
 *
 * @see getStatistics
 */
function Statistics() {
  this.buffersByteLength = 0;
  this.numberOfImages = 0;
  this.numberOfExternalRequests = 0;
  this.numberOfDrawCalls = 0;
  this.numberOfRenderedPrimitives = 0;
  this.numberOfNodes = 0;
  this.numberOfMeshes = 0;
  this.numberOfMaterials = 0;
  this.numberOfAnimations = 0;
}

/**
 * Creates a string listing the statistics along with their descriptions.
 *
 * @returns {String} A string describing the statistics for the glTF asset.
 */
Statistics.prototype.toString = function () {
  return (
    `Total byte length of all buffers: ${this.buffersByteLength} bytes` +
    `\nImages: ${this.numberOfImages}\nDraw calls: ${this.numberOfDrawCalls}\nRendered primitives (e.g., triangles): ${this.numberOfRenderedPrimitives}\nNodes: ${this.numberOfNodes}\nMeshes: ${this.numberOfMeshes}\nMaterials: ${this.numberOfMaterials}\nAnimations: ${this.numberOfAnimations}\nExternal requests (not data uris): ${this.numberOfExternalRequests}`
  );
};
