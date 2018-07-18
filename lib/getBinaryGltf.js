'use strict';
var Cesium = require('cesium');
var mime = require('mime');
var sizeOf = require('image-size');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');
var mergeBuffers = require('./mergeBuffers');
var removePipelineExtras = require('./removePipelineExtras');

module.exports = getBinaryGltf;

// Update object with KHR_binary_glTF properties and add to body and bufferViews
function updateBinaryObject(gltf, objects, name, pipelineExtras, state) {
    var bufferViews = gltf.bufferViews;
    if (defined(objects)) {
        for (var objectId in objects) {
            if (objects.hasOwnProperty(objectId)) {
                var object = objects[objectId];

                // Update object with binary format
                object.uri = 'data:,';
                object.extensions = defaultValue(object.extensions, {});
                object.extensions.KHR_binary_glTF = defaultValue(object.extensions.KHR_binary_glTF, {});
                var KHR_binary_glTF = object.extensions.KHR_binary_glTF;

                // Create a bufferView based on the byte length and current offset
                var bufferViewKeys = Object.keys(bufferViews);
                while (bufferViewKeys.indexOf('binary_bufferView' + state.currentBinaryView) !== -1) {
                    state.currentBinaryView++;
                }

                var objectSource = Buffer.from(object.extras._pipeline.source);
                var bufferViewId = 'binary_bufferView' + state.currentBinaryView;
                KHR_binary_glTF.bufferView = bufferViewId; //Create bufferview
                bufferViews[bufferViewId] = {
                    buffer : 'binary_glTF',
                    byteLength : objectSource.length,
                    byteOffset : state.offset
                };
                state.offset += objectSource.length;

                // Append the object source to the binary body
                pipelineExtras.source = Buffer.concat([pipelineExtras.source, objectSource]);

                // Add additional properties for images
                if (name === 'images') {
                    var mimeType = mime.getType(object.extras._pipeline.extension);
                    KHR_binary_glTF.mimeType = mimeType;

                    if (mimeType !== 'image/ktx' && mimeType !== 'image/crn') {
                        var dimensions = sizeOf(object.extras._pipeline.source);
                        KHR_binary_glTF.width = dimensions.width;
                        KHR_binary_glTF.height = dimensions.height;
                    }
                }
            }
        }
    }
}

/**
 * Get binary glTF representation of the glTF asset.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Boolean} embed Embed shaders into the binary.
 * @param {Boolean} embedImage Embed images into the binary
 * @returns {{glb: Buffer, header: Buffer, scene: Buffer, body: Buffer}} glb holds the whole buffer, each piece is also available via the returned object.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function getBinaryGltf(gltf, embed, embedImage) {
    addExtensionsUsed(gltf, 'KHR_binary_glTF');
    // Create the special binary buffer from the existing buffers
    gltf.bufferViews = defaultValue(gltf.bufferViews, {});
    gltf.buffers = defaultValue(gltf.buffers, {});
    mergeBuffers(gltf, 'binary_glTF');

    var buffers = gltf.buffers;
    var currentOffset = buffers.binary_glTF.byteLength;
    var pipelineExtras = buffers.binary_glTF.extras._pipeline;
    var state = {
        offset: currentOffset,
        currentBinaryView: 0
    };

    if (embed) {
        updateBinaryObject(gltf, gltf.shaders, 'shaders', pipelineExtras, state);
    }
    if (embedImage) {
        updateBinaryObject(gltf, gltf.images, 'images', pipelineExtras, state);
    }

    // Update binary with compressed textures
    if (embedImage) {
        var images = gltf.images;
        for (var imageId in images) {
            if (images.hasOwnProperty(imageId)) {
                var image = images[imageId];
                if (defined(image.extras) && defined(image.extras.compressedImage3DTiles)) {
                    var compressedImages = image.extras.compressedImage3DTiles;
                    updateBinaryObject(gltf, compressedImages, 'images', pipelineExtras, state);
                }
            }
        }
    }

    var body = buffers.binary_glTF.extras._pipeline.source;
    buffers.binary_glTF.byteLength = state.offset;

    // Remove extras objects before writing
    removePipelineExtras(gltf);

    // Create padded binary scene buffer and calculate total length
    var sceneString = JSON.stringify(gltf);
    var sceneBuffer = Buffer.from(sceneString);
    var sceneLength = sceneBuffer.length;
    var paddingLength = 4 - (sceneLength % 4); // pad out to 4 bytes as per glb specification
    sceneLength += paddingLength;
    var paddingBuffer = Buffer.alloc(paddingLength, ' ');
    var scene = Buffer.concat([sceneBuffer, paddingBuffer]);

    var bodyOffset = 20 + sceneLength;
    var glbLength = bodyOffset + body.length;

    // Write binary glTF header (magic, version, length, sceneLength, sceneFormat)
    var header = Buffer.alloc(20);
    header.write('glTF', 0);
    header.writeUInt32LE(1, 4);
    header.writeUInt32LE(glbLength, 8);
    header.writeUInt32LE(sceneLength, 12);
    header.writeUInt32LE(0, 16);

    // Create overall buffer
    var glb = Buffer.concat([header, scene, body], glbLength);

    return {
        glb : glb,
        header : header,
        scene : scene,
        body : body
    };
}
