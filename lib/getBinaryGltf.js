'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var sizeOf = require('image-size');
var mime = require('mime');
var mergeBuffers = require('./mergeBuffers');
var removePipelineExtras = require('./removePipelineExtras');

module.exports = getBinaryGltf;

//Update object with KHR_binary_glTF properties and add to body and bufferViews
function updateBinaryObject(gltf, pipelineExtras, name, state) {
    var bufferViews = gltf.bufferViews;
    var objects = gltf[name];
    if (defined(objects)) {
        for (var objectId in objects) {
            if (objects.hasOwnProperty(objectId)) {
                var object = objects[objectId];

                //Update object with binary format
                object.uri = 'data:,';
                object.extensions = defaultValue(object.extensions, {});
                object.extensions.KHR_binary_glTF = defaultValue(object.extensions.KHR_binary_glTF, {});
                var KHR_binary_glTF = object.extensions.KHR_binary_glTF;

                //Create a bufferView based on the byte length and current offset
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

                //Append the object source to the binary body
                pipelineExtras.source = Buffer.concat([pipelineExtras.source, objectSource]);

                //Add additional properties for images
                if (name === 'images') {
                    KHR_binary_glTF.mimeType = mime.lookup(object.extras._pipeline.extension);

                    var dimensions = sizeOf(object.extras._pipeline.source);
                    KHR_binary_glTF.width = dimensions.width;
                    KHR_binary_glTF.height = dimensions.height;
                }
            }
        }
    }
}

function getBinaryGltf(gltf, callback) {
    //Create the special binary buffer from the existing buffers
    gltf.bufferViews = defaultValue(gltf.bufferViews, {});
    gltf.buffers = defaultValue(gltf.buffers, {});
    mergeBuffers(gltf, 'binary_glTF');

    var buffers = gltf.buffers;
    var currentOffset = buffers.binary_glTF.byteLength;
    var pipelineExtras = buffers.binary_glTF.extras._pipeline;
    var state = {
        offset : currentOffset,
        currentBinaryView : 0
    };

    updateBinaryObject(gltf, pipelineExtras, 'shaders', state);
    updateBinaryObject(gltf, pipelineExtras, 'images', state);

    var body = buffers.binary_glTF.extras._pipeline.source;
    buffers.binary_glTF.byteLength = state.offset;

    //Remove extras objects before writing
    removePipelineExtras(gltf);

    //Create padded binary scene string and calculate total length
    var sceneString = JSON.stringify(gltf);
    var sceneLength = Buffer.byteLength(sceneString);
    sceneLength += 4 - (sceneLength % 4);
    var padding = new Array(sceneLength + 1).join(' ');
    sceneString = (sceneString + padding).substring(0, sceneLength);
    var bodyOffset = 20 + sceneLength;
    var glbLength = bodyOffset + body.length;

    //Write binary glTF header (magic, version, length, sceneLength, sceneFormat)
    var header = new Buffer(20);
    header.write('glTF', 0);
    header.writeUInt32LE(1, 4);
    header.writeUInt32LE(glbLength, 8);
    header.writeUInt32LE(sceneLength, 12);
    header.writeUInt32LE(0, 16);

    //Create scene buffer and overall buffer
    var scene = new Buffer(sceneString);
    var glb = Buffer.concat([header, scene, body], glbLength);
    
    if (callback) {
        process.nextTick(function () {
            callback(header, scene, body);
        });
    }
    return glb;
}