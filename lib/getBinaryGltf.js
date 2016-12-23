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
function updateBinaryObject(gltf, pipelineExtras, name, state) {
    var bufferViews = gltf.bufferViews;
    var objects = gltf[name];
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

                var objectSource = new Buffer(object.extras._pipeline.source);
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
                    // .crn (Crunch) is not a supported mime type, so add it
                    mime.define({
                        'image/crn' : ['crn']
                    });
                    var mimeType = mime.lookup(object.extras._pipeline.extension);
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
        updateBinaryObject(gltf, pipelineExtras, 'shaders', state);
    }
    if (embedImage) {
        updateBinaryObject(gltf, pipelineExtras, 'images', state);
    }

    var body = buffers.binary_glTF.extras._pipeline.source;
    buffers.binary_glTF.byteLength = state.offset;

    // Remove extras objects before writing
    removePipelineExtras(gltf);

    // Create padded binary scene string and calculate total length
    var sceneString = JSON.stringify(gltf);
    var sceneLength = Buffer.byteLength(sceneString);
    sceneLength += 4 - (sceneLength % 4);
    var padding = new Array(sceneLength + 1).join(' ');
    sceneString = (sceneString + padding).substring(0, sceneLength);
    var bodyOffset = 20 + sceneLength;
    var glbLength = bodyOffset + body.length;

    // Write binary glTF header (magic, version, length, sceneLength, sceneFormat)
    var header = new Buffer(20);
    header.write('glTF', 0);
    header.writeUInt32LE(1, 4);
    header.writeUInt32LE(glbLength, 8);
    header.writeUInt32LE(sceneLength, 12);
    header.writeUInt32LE(0, 16);

    // Create scene buffer and overall buffer
    var scene = new Buffer(sceneString);
    var glb = Buffer.concat([header, scene, body], glbLength);

    return {
        glb : glb,
        header : header,
        scene : scene,
        body : body
    };
}