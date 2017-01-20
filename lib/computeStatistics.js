'use strict';
var Cesium = require('cesium');
var isDataUri = require('./isDataUri');
var PrimitiveHelpers = require('./PrimitiveHelpers');

var defined = Cesium.defined;

module.exports = {
    getStatistics : getStatistics,
    printStatistics : printStatistics
};

function getBuffersSize(buffers) {
    var size = 0;
    for (var id in buffers) {
        if (buffers.hasOwnProperty(id)) {
            size += buffers[id].byteLength;
        }
    }
    return size;
}

function getNumberOfExternalProperties(property) {
    var id;
    var uri;
    var count = 0;
    for (id in property) {
        if (property.hasOwnProperty(id)) {
            uri = property[id].uri;
            if (defined(uri) && !isDataUri(uri)) {
                ++count;
            }
        }
    }
    return count;
}

function getNumberOfExternalRequests(gltf) {
    var count = 0;

    count += getNumberOfExternalProperties(gltf.buffers);
    count += getNumberOfExternalProperties(gltf.images);
    count += getNumberOfExternalProperties(gltf.shaders);

    return count;
}

function getNumberOfProperties(object) {
    return Object.keys(object).length;
}

function getDrawCallStatistics(gltf) {
    var numberOfDrawCalls = 0;
    var numberOfRenderedPrimitives = 0;

    var primitives = PrimitiveHelpers.getAllPrimitives(gltf);
    var primitivesLength = primitives.length;

    numberOfDrawCalls += primitivesLength;

    for (var m = 0; m < primitivesLength; ++m) {
        var primitive = primitives[m];
        var indices = primitive.indices;
        var indicesCount = gltf.accessors[indices].count;

        switch(primitive.primitive) {
            case 0: // POINTS
                numberOfRenderedPrimitives += indicesCount;
                break;
            case 1: // LINES
                numberOfRenderedPrimitives += (indicesCount / 2);
                break;
            case 2: // LINE_LOOP
                numberOfRenderedPrimitives += indicesCount;
                break;
            case 3: // LINE_STRIP
                numberOfRenderedPrimitives += Math.max(indicesCount - 1, 0);
                break;
            case 4: // TRIANGLES
                numberOfRenderedPrimitives += (indicesCount / 3);
                break;
            case 5: // TRIANGLE_STRIP
            case 6: // TRIANGLE_FAN
                numberOfRenderedPrimitives += Math.max(indicesCount - 2, 0);
                break;
        }
    }

    return {
        numberOfDrawCalls : numberOfDrawCalls,
        numberOfRenderedPrimitives : numberOfRenderedPrimitives
    };
}

/**
 * @typedef {Object} gltfStatistic
 * @property {Number} buffersSizeInBytes The total size of all the buffers.
 * @property {Number} numberOfImages The number of images part of the assest.
 * @property {Number} numberOfExternalRequests The number of external requests to fetch the assest data.
 * @property {Number} numberOfDrawCalls The number of draw calls required in the asset.
 * @property {Number} numberOfRenderedPrimitives The number of rendered primitives.
 * @property {Number} numberOfNodes The total number of nodes in the assest.
 * @property {Number} numberOfMeshes The total number of meshes in the assest.
 * @property {Number} numberOfMaterials The total number of materials in the assest.
 * @property {Number} numberOfAnimations The total number of animations in the assest.
 */

/**
 * Returns an object containing the statistics for the glTF assest.
 *
 * @param {Object} gltf A javascript object containing a glTF asset with extras and defaults.
 * @returns {gltfStatistic} Object containing the properties of the assest.
 */
function getStatistics(gltf) {
    if (!defined(gltf)) {
        return new Error('gltf must be defined');
    }

    var drawStats = getDrawCallStatistics(gltf);

    return {
        buffersSizeInBytes          : getBuffersSize(gltf.buffers),
        numberOfImages              : getNumberOfProperties(gltf.images),
        numberOfExternalRequests    : getNumberOfExternalRequests(gltf),
        numberOfDrawCalls           : drawStats.numberOfDrawCalls,
        numberOfRenderedPrimitives  : drawStats.numberOfRenderedPrimitives,
        numberOfNodes               : getNumberOfProperties(gltf.nodes),
        numberOfMeshes              : getNumberOfProperties(gltf.meshes),
        numberOfMaterials           : getNumberOfProperties(gltf.materials),
        numberOfAnimations          : getNumberOfProperties(gltf.animations)
    };
}

/**
 * Print the glTF statistics onto the console.
 *
 * @param {Object} gltf A javascript object containing a glTF asset with extras and defaults.
 * @param {String} gltfPath The path of the glTF file being analysed.
 *
 * @see getStatistics
 */
function printStatistics(gltf, gltfPath) {
    var stats = getStatistics(gltf);
    var output =
        '\nKey statistics for ' + gltfPath +
        '\n--------------\n' +
        '\nTotal size of all buffers: ' + stats.buffersSizeInBytes + ' bytes' +
        '\nImages: ' + stats.numberOfImages +
        '\nExternal requests (not data uris): ' + stats.numberOfExternalRequests +
        '\n' +
        '\nDraw calls: ' + stats.numberOfDrawCalls +
        '\nRendered primitives (e.g., triangles): ' + stats.numberOfRenderedPrimitives +
        '\n' +
        '\nNodes: ' + stats.numberOfNodes +
        '\nMeshes: ' + stats.numberOfMeshes +
        '\nMaterials: ' + stats.numberOfMaterials +
        '\nAnimations: ' + stats.numberOfAnimations;

    console.log(output);
}
