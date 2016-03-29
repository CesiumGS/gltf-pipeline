'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var sizeOf = require('image-size');
var mime = require('mime');
var objectValues = require('object-values');
var writeSource = require('./writeSource');
var removePipelineExtras = require('./removePipelineExtras');

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, outputPath, createDirectory, callback) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
    }

    //Create the binary body and append each buffer
    var body = new Buffer(0);
    gltf.buffers = defaultValue(gltf.buffers, {});
    gltf.bufferViews = defaultValue(gltf.bufferViews, {});
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    var currentOffset = 0;
    if (Object.keys(bufferViews).length > 0) {
        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                //Add the buffer to the binary source
                var buffer = buffers[bufferId];
                body = Buffer.concat([body, buffer.extras._pipeline.source]);

                //Update the offset for each accessing bufferView
                var accessingBufferViews = objectValues(bufferViews);
                accessingBufferViews = accessingBufferViews.filter(function(bufferView) {
                    return bufferView.buffer === bufferId;
                });
                var maxEndOffset = 0;
                for (var i = 0; i < accessingBufferViews.length; i++) {
                    var currentView = accessingBufferViews[i];
                    maxEndOffset = Math.max(maxEndOffset, currentView.byteOffset + currentView.byteLength);
                    currentView.buffer = 'binary_glTF';
                    currentView.byteOffset += currentOffset;
                }
                currentOffset += maxEndOffset;
            }
        }
    }
    
    var currentBinaryView = 0;
    //Update object with KHR_binary_glTF properties and add to body and bufferViews
    var updateBinaryObject = function(name) {
        var objects = gltf[name];
        if (defined(objects)) {
            for (var objectId in objects) {
                if (objects.hasOwnProperty(objectId)) {
                    var object = objects[objectId];

                    //Update object with binary format
                    object.uri = "data:,";
                    object.extensions = defaultValue(object.extensions, {});
                    object.extensions.KHR_binary_glTF = defaultValue(object.extensions.KHR_binary_glTF, {});
                    var KHR_binary_glTF = object.extensions.KHR_binary_glTF;

                    //Create a bufferView based on the byte length and current offset
                    var bufferViewKeys = Object.keys(bufferViews);
                    while (bufferViewKeys.indexOf('binary_bufferView' + currentBinaryView) != -1) {
                        currentBinaryView++;
                    }

                    var bufferViewId = 'binary_bufferView' + currentBinaryView;
                    KHR_binary_glTF.bufferView = bufferViewId; //Create bufferview
                    bufferViews[bufferViewId] = {
                        "buffer": "binary_glTF",
                        "byteLength": object.extras._pipeline.source.length,
                        "byteOffset": currentOffset
                    };
                    currentOffset += object.extras._pipeline.source.length;

                    //Append the object source to the binary body
                    body = Buffer.concat([body, object.extras._pipeline.source]);

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

    updateBinaryObject('shaders');
    updateBinaryObject('images');

    //Replace existing buffer with new binary_glTF buffer
    gltf.buffers = {
        "binary_glTF": {
          "type": "arraybuffer",
          "byteLength": body.length,
          "uri": "data:,"
        }
    }

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

    fs.writeFile(outputPath, glb, function (err) {
        if (err) {
            if (callback) {
                callback(err);
            }
            else{
                throw err;
            }
        }
        if (callback) {
            callback(header, scene, body);
        }
    });
}