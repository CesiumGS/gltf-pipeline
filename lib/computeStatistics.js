'use strict';
var Cesium = require('cesium');
var isDataUri = require('./isDataUri');
var PrimitiveHelpers = require('./PrimitiveHelpers');

var defined = Cesium.defined;

module.exports = {
    getStatistics : getStatistics,
    printStatistics : printStatistics
};

/**
 * Creates an object type for glTF Statistics.
 *
 * @property {Number} buffersSizeInBytes The total size of all the buffers.
 * @property {Number} numberOfImages The number of images part of the assest.
 * @property {Number} numberOfExternalRequests The number of external requests to fetch the assest data.
 * @property {Number} numberOfDrawCalls The number of draw calls required in the asset.
 * @property {Number} numberOfRenderedPrimitives The number of rendered primitives.
 * @property {Number} numberOfNodes The total number of nodes in the assest.
 * @property {Number} numberOfMeshes The total number of meshes in the assest.
 * @property {Number} numberOfMaterials The total number of materials in the assest.
 * @property {Number} numberOfAnimations The total number of animations in the assest.
 *
 * @constructor
 *
 * @see getStatistics
 * @see printStatistics
 */
function Statistics() {
    this.bufferSizeInBytes = undefined;
    this.numberOfImages = undefined;
    this.numberOfExternalRequests = undefined;
    this.numberOfDrawCalls = undefined;
    this.numberOfRenderedPrimitives = undefined;
    this.numberOfNodes = undefined;
    this.numberOfMeshes = undefined;
    this.numberOfMaterials = undefined;
    this.numberOfAnimations = undefined;
}

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
 * Returns an object containing the statistics for the glTF assest.
 *
 * @param {Object} gltf A javascript object containing a glTF asset with extras and defaults.
 * @returns {Statistics} Object containing the properties of the assest.
 *
 * @see Statistics
 * @see printStatistics
 */
function getStatistics(gltf) {
    if (!defined(gltf)) {
        return new Error('gltf must be defined');
    }

    var drawStats = getDrawCallStatistics(gltf);

    var statistics = new Statistics();
    statistics.buffersSizeInBytes          = getBuffersSize(gltf.buffers);
    statistics.numberOfImages              = getNumberOfProperties(gltf.images);
    statistics.numberOfExternalRequests    = getNumberOfExternalRequests(gltf);
    statistics.numberOfDrawCalls           = drawStats.numberOfDrawCalls;
    statistics.numberOfRenderedPrimitives  = drawStats.numberOfRenderedPrimitives;
    statistics.numberOfNodes               = getNumberOfProperties(gltf.nodes);
    statistics.numberOfMeshes              = getNumberOfProperties(gltf.meshes);
    statistics.numberOfMaterials           = getNumberOfProperties(gltf.materials);
    statistics.numberOfAnimations          = getNumberOfProperties(gltf.animations);

    return statistics;
}

/**
 * Print the glTF statistics onto the console.
 *
 * @param {Object} gltf A javascript object containing a glTF asset with extras and defaults.
 * @param {String} gltfPath The path of the glTF file being analysed.
 *
 * @see Statistics
 * @see getStatistics
 */
function printStatistics(gltf, gltfPath) {
    var statistics = getStatistics(gltf);
    var output =
        '\nKey statistics for ' + gltfPath +
        '\n--------------\n' +
        '\nTotal size of all buffers: ' + statistics.buffersSizeInBytes + ' bytes' +
        '\nImages: ' + statistics.numberOfImages +
        '\nExternal requests (not data uris): ' + statistics.numberOfExternalRequests +
        '\n' +
        '\nDraw calls: ' + statistics.numberOfDrawCalls +
        '\nRendered primitives (e.g., triangles): ' + statistics.numberOfRenderedPrimitives +
        '\n' +
        '\nNodes: ' + statistics.numberOfNodes +
        '\nMeshes: ' + statistics.numberOfMeshes +
        '\nMaterials: ' + statistics.numberOfMaterials +
        '\nAnimations: ' + statistics.numberOfAnimations;

    console.log(output);
}
