'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = getStatistics;

/**
 * Contains statistics for a glTF asset.
 *
 * @property {Number} buffersSizeInBytes The total size of all the buffers.
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
 * @see printStatistics
 */
function Statistics() {
    this.buffersSizeInBytes = 0;
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
Statistics.prototype.toString = function() {
    var output =
        'Total size of all buffers: ' + this.buffersSizeInBytes + ' bytes' +
        '\nImages: ' + this.numberOfImages +
        '\nDraw calls: ' + this.numberOfDrawCalls +
        '\nRendered primitives (e.g., triangles): ' + this.numberOfRenderedPrimitives +
        '\nNodes: ' + this.numberOfNodes +
        '\nMeshes: ' + this.numberOfMeshes +
        '\nMaterials: ' + this.numberOfMaterials +
        '\nAnimations: ' + this.numberOfAnimations +
        '\nExternal requests (not data uris): ' + this.numberOfExternalRequests;

    return output;
};

function isDataUri(uri) {
    //Return false if the uri is undefined
    if (!defined(uri)) {
        return false;
    }

    //Return true if the uri is a data uri
    return /^data\:/i.test(uri);
}

function getAllPrimitives(gltf) {
    var primitives = [];
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            primitives = primitives.concat(mesh.primitives);
        }
    }
    return primitives;
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

    var primitives = getAllPrimitives(gltf);
    var primitivesLength = primitives.length;

    numberOfDrawCalls += primitivesLength;

    for (var m = 0; m < primitivesLength; ++m) {
        var primitive = primitives[m];
        var indices = primitive.indices;
        var indicesCount = gltf.accessors[indices].count;

        switch(primitive.mode) {
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
 * Returns an object containing the statistics for the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset with extras and defaults.
 * @returns {Statistics} Object containing the statistics of the glTF asset.
 *
 * @see Statistics
 */
function getStatistics(gltf) {
    if (!defined(gltf)) {
        throw new DeveloperError('gltf must be defined');
    }

    var drawStats = getDrawCallStatistics(gltf);

    var statistics = new Statistics();
    statistics.buffersSizeInBytes = getBuffersSize(gltf.buffers);
    statistics.numberOfImages = getNumberOfProperties(gltf.images);
    statistics.numberOfExternalRequests = getNumberOfExternalRequests(gltf);
    statistics.numberOfDrawCalls = drawStats.numberOfDrawCalls;
    statistics.numberOfRenderedPrimitives = drawStats.numberOfRenderedPrimitives;
    statistics.numberOfNodes = getNumberOfProperties(gltf.nodes);
    statistics.numberOfMeshes = getNumberOfProperties(gltf.meshes);
    statistics.numberOfMaterials = getNumberOfProperties(gltf.materials);
    statistics.numberOfAnimations = getNumberOfProperties(gltf.animations);

    return statistics;
}
