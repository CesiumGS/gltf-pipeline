'use strict';
var Cesium = require('cesium');
var addPipelineExtras = require('./addPipelineExtras');
var removeExtensionsUsed = require('./removeExtensionsUsed');
var updateVersion = require('./updateVersion');

var ComponentDatatype = Cesium.ComponentDatatype;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var getMagic = Cesium.getMagic;
var getStringFromTypedArray = Cesium.getStringFromTypedArray;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = parseBinaryGltf;

/**
 * Parses a binary glTF buffer into glTF JSON.
 *
 * @param {Uint8Array} data The binary glTF data to parse.
 * @returns {Object} The parsed binary glTF.
 */
function parseBinaryGltf(data) {
    var headerView = ComponentDatatype.createArrayBufferView(WebGLConstants.INT, data.buffer, data.byteOffset, 5);

    // Check that the magic string is present
    var magic = getMagic(data);
    if (magic !== 'glTF') {
        throw new DeveloperError('File is not valid binary glTF');
    }

    // Check that the version is 1 or 2
    var version = headerView[1];
    if (version !== 1 && version !== 2) {
        throw new DeveloperError('Binary glTF version is not 1 or 2');
    }

    var gltf;
    var buffers;
    var length;
    // Load binary glTF version 1
    if (version === 1) {
        length = headerView[2];
        var contentLength = headerView[3];
        var contentFormat = headerView[4];

        // Check that the content format is 0, indicating that it is JSON
        if (contentFormat !== 0) {
            throw new DeveloperError('Binary glTF scene format is not JSON');
        }
        var contentString = getStringFromTypedArray(data.slice(20, 20 + contentLength));
        gltf = JSON.parse(contentString);

        var binaryData = data.slice(20 + contentLength, length);
        buffers = gltf.buffers;
        if (defined(buffers) && Object.keys(buffers).length > 0) {
            var binaryGltfBuffer = buffers.binary_glTF;
            // In some older models, the binary glTF buffer is named KHR_binary_glTF
            if (!defined(binaryGltfBuffer)) {
                binaryGltfBuffer = buffers.KHR_binary_glTF;
            }
            if (defined(binaryGltfBuffer)) {
                binaryGltfBuffer.extras = {
                    _pipeline: {
                        source: binaryData
                    }
                };
            }
        }
        // Update to glTF 2.0
        updateVersion(gltf);
        // Remove the KHR_binary_glTF extension
        removeExtensionsUsed(gltf, 'KHR_binary_glTF');
        addPipelineExtras(gltf);
    }

    // Load binary glTF version 2
    if (version === 2) {
        length = headerView[2];
        var byteOffset = 12;
        var binaryBuffer;
        while (byteOffset < length) {
            var chunkHeaderView = ComponentDatatype.createArrayBufferView(WebGLConstants.INT, data.buffer, data.byteOffset + byteOffset, 2);
            var chunkLength = chunkHeaderView[0];
            var chunkType = chunkHeaderView[1];
            byteOffset += 8;
            var chunkBuffer = data.slice(byteOffset, byteOffset + chunkLength);
            byteOffset += chunkLength;
            // Load JSON chunk
            if (chunkType === 0x4E4F534A) {
                var jsonString = chunkBuffer.toString();
                gltf = JSON.parse(jsonString);
                addPipelineExtras(gltf);
            }
            // Load Binary chunk
            else if (chunkType === 0x004E4942) {
                binaryBuffer = chunkBuffer;
            }
        }
        if (defined(gltf) && defined(binaryBuffer)) {
            buffers = gltf.buffers;
            if (defined(buffers) && buffers.length > 0) {
                var buffer = buffers[0];
                buffer.extras._pipeline.source = binaryBuffer;
            }
        }
    }
    return gltf;
}