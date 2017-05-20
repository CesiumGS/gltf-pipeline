'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var loadGltfUris = require('./loadGltfUris');

module.exports = readGltf;

/**
 * Reads a glTF asset from the disk.
 * @param {String} gltfPath The file path for the glTF asset.
 * @param {Object} [options] Object with the following properties.
 * @param {String} [options.basePath] The base path to use for resolving external references. Defaults to the directory containing the glTF.
 * @returns {Object} A javascript object containing a glTF hierarchy.
 */
function readGltf(gltfPath, options) {
    options = defaultValue(options, {});

    if (!defined(gltfPath)) {
        throw new DeveloperError('Input path is undefined.');
    }

    if (!defined(options.basePath)) {
        options.basePath = path.dirname(gltfPath);
    }

    var fileExtension = path.extname(gltfPath);

    if (fileExtension !== '.glb' && fileExtension !== '.gltf') {
        throw new DeveloperError('Invalid glTF file.');
    }

    return Promise.resolve(fsExtra.readFile(gltfPath))
        .then(function(data) {
            var gltf;
            if (fileExtension === '.glb') {
                gltf = parseBinaryGltf(data);
            }
            else if (fileExtension === '.gltf') {
                gltf = JSON.parse(data);
                addPipelineExtras(gltf);
            }
            return loadGltfUris(gltf, options);
        })
        .then(function(gltf) {
            return gltf;
        });
}
