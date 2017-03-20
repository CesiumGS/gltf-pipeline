'use strict';
var Cesium = require('cesium');
var mime = require('mime');
var addToArray = require('./addToArray');
var ForEach = require('./ForEach');
var mergeBuffers = require('./mergeBuffers');
var removePipelineExtras = require('./removePipelineExtras');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

// .crn (Crunch) is not a supported mime type, so add it
mime.define({'image/cr': ['crn']});

module.exports = getBinaryGltf;

function updateBinaryObject(gltf, objects, hasMimeType) {
    hasMimeType = defaultValue(hasMimeType, false);
    var buffer = gltf.buffers[0];
    var bufferPipelineExtras = buffer.extras._pipeline;
    ForEach.arrayOfObjects(objects, function(object) {
        var pipelineExtras = object.extras._pipeline;
        var source = pipelineExtras.source;
        var bufferView = {
            buffer: 0,
            byteLength: source.length,
            byteOffset: buffer.byteLength
        };
        if (hasMimeType) {
            object.mimeType = mime.lookup(pipelineExtras.extension);
        }
        buffer.byteLength += source.length;
        bufferPipelineExtras.source = Buffer.concat([bufferPipelineExtras.source, source]);
        var bufferViewId = addToArray(gltf.bufferViews, bufferView);
        object.bufferView = bufferViewId;
    });
}

/**
 * Get binary glTF representation of the glTF asset.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options Options specifying custom behavior.
 * @param {Boolean} options.embed Embed shaders into the binary.
 * @param {Boolean} options.embedImage Embed images into the binary
 * @returns {Buffer} A buffer containing the binary glTF blob
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function getBinaryGltf(gltf, options) {
    options = defaultValue(options, {});
    options.embed = defaultValue(options.embed, true);
    options.embedImage = defaultValue(options.embedImage, true);
    // Create the special binary buffer from the existing buffers
    gltf.bufferViews = defaultValue(gltf.bufferViews, []);
    gltf.buffers = defaultValue(gltf.buffers, []);
    mergeBuffers(gltf);
    var buffers = gltf.buffers;
    var buffer;
    if (buffers.length > 0) {
        buffer = buffers[0];
    } else {
        buffer = {
            byteLength: 0,
            extras: {
                _pipeline: {
                    source: new Buffer([]),
                    extension: '.bin'
                }
            }
        };
        buffers.push(buffer);
    }

    if (options.embed) {
        updateBinaryObject(gltf, gltf.shaders);
    }
    if (options.embedImage) {
        updateBinaryObject(gltf, gltf.images, true);
        ForEach.image(function(gltf, image) {
            if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
                var compressedImages = image.extras.compressedImage3DTiles;
                updateBinaryObject(gltf, compressedImages, true);
            }
        });
    }

    var binaryBuffer = buffer.extras._pipeline.source;
    if (binaryBuffer.length === 0) {
        delete gltf.buffers;
    }
    // Remove extras objects before writing
    removePipelineExtras(gltf);

    // Create padded binary scene string
    var jsonString = JSON.stringify(gltf);
    while (jsonString.length % 4 !== 0) {
        jsonString += ' ';
    }
    var jsonBuffer = Buffer.from(jsonString);

    // Allocate buffer (Global header) + (JSON chunk header) + (JSON chunk) + (Binary chunk header) + (Binary chunk)
    var glbLength = 12 + 8 + jsonBuffer.length + 8 + binaryBuffer.length;
    var glb = new Buffer(glbLength);

    // Write binary glTF header (magic, version, length)
    var byteOffset = 0;
    glb.writeUInt32LE(0x46546C67, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(2, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(glbLength, byteOffset);
    byteOffset += 4;

    // Write JSON Chunk header (length, type)
    glb.writeUInt32LE(jsonBuffer.length, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(0x4E4F534A, byteOffset); // JSON
    byteOffset += 4;

    // Write JSON Chunk
    jsonBuffer.copy(glb, byteOffset);
    byteOffset += jsonBuffer.length;

    // Write Binary Chunk header (length, type)
    glb.writeUInt32LE(binaryBuffer.length, byteOffset);
    byteOffset += 4;
    glb.writeUInt32LE(0x004E4942, byteOffset); // BIN
    byteOffset += 4;

    // Write Binary Chunk
    binaryBuffer.copy(glb, byteOffset);
    return glb;
}