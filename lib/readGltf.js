'use strict';
var Cesium = require('cesium');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var parseBinaryGltf = require('./parseBinaryGltf');
var addPipelineExtras = require('./addPipelineExtras');
var loadGltfUris = require('./loadGltfUris');

var fsReadFile = Promise.promisify(fs.readFile);

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
    return fsReadFile(gltfPath)
        .then(function(data) {
            var gltf;
            if (fileExtension === '.glb') {
                gltf = parseBinaryGltf(data);

                // Convert buffer source from a Uint8Array to a Buffer
                var buffer = gltf.buffers[0];
                var source = buffer.extras._pipeline.source;
                buffer.extras._pipeline.source = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
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
