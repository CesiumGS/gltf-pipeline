'use strict';
var path = require('path');
var mkdirp = require('mkdirp');
var sizeOf = require('image-size');
var mime = require('mime');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var writeSource = require('./writeSource');

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, outputPath, isEmbedded, createDirectory) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
    }

    //Create the binary body and append each buffer
    var body = new Buffer();
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

    var currentOffset = 0;
    if (defined(buffers) && defined(bufferViews)) {
        for (var bufferId in buffers) {
            if (buffers.hasOwnProperty(bufferId)) {
                //Add the buffer to the binary source
                var buffer = buffers[bufferId];
                body = Buffer.concat([body, buffer]);

                //Update each accessing bufferView
                var accessingBufferViews = objectValues(bufferViews);
                accessingBufferViews = accessingBufferViews.filter(function(bufferView) {
                    return bufferView.buffer === bufferId;
                });
                var maxEndOffset = 0;
                for (int i = 0; i < accessingBufferViews.length; i++) {
                    var currentView = accessingBufferViews[i];
                    maxEndOffset = Math.max(maxEndOffset, currentView.byteOffset + currentView.byteLength);
                    currentView.buffer = 'binary_glTF';
                    currentView.byteOffset += currentOffset;
                }
                currentOffset += maxEndOffset;
            }
        }
    }

    gltf.bufferViews = defaultValue(gltf.bufferViews, {}); //***fix repetition
    bufferViews = gltf.bufferViews;
    var bufferViewKeys = Object.keys(bufferViews);
    var currentBinaryView = 0;
    var images = gltf.images;
    if (defined(images)) {
        for (var imageId in images) {
            if (images.hasOwnProperty(imageId)) {
                var image = images[imageId];
                
                //Update image with binary format
                image.uri = "data:,";
                image.extensions = defaultValue(image.extensions, {});
                image.extensions.KHR_binary_glTF = defaultValue(image.extensions.KHR_binary_glTF, {});
                var KHR_binary_glTF = image.extensions.KHR_binary_glTF;
                KHR_binary_glTF.mimeType = mime.lookup(image.extras._pipeline.extension);

                var dimensions = sizeOf(image.extras._pipeline.source); //***source.data?
                KHR_binary_glTF.width = dimensions.width.
                KHR_binary_glTF.height = dimensions.height;

                //Create a bufferView with the byte length and current offset
                while (bufferViewKeys.indexOf('binary_bufferView' + currentBinaryView) != -1) {
                    currentBinaryView++;
                }

                var bufferViewId = 'binary_bufferView' + currentBinaryView;
                KHR_binary_glTF.bufferView = bufferViewId; //Create bufferview
                bufferViews[bufferViewId] = {
                    "buffer": "binary_glTF",
                    "byteLength": image.extras._pipeline.source.length,
                    "byteOffset": currentOffset
                };
                currentOffset += image.extras._pipeline.source.length;

                body = Buffer.concat([body, image.extras._pipeline.source]);
            }
        }
    }

    if (defined(shaders)) {
        for (var shaderId in shaders) {
            if (shaders.hasOwnProperty(shaderId)) {
                var shader = shaders[shaderId];

                //Update shader with binary format
                shader.uri = "data:,";
                shader.extensions = defaultValue(shader.extensions, {});
                shader.extensions.KHR_binary_glTF = defaultValue(shader.extensions.KHR_binary_glTF, {});
                var KHR_binary_glTF = shader.extensions.KHR_binary_glTF;

                //Create a bufferView with the byte length and current offset
                while (bufferViewKeys.indexOf('binary_bufferView' + currentBinaryView) != -1) {
                    currentBinaryView++;
                }

                var bufferViewId = 'binary_bufferView' + currentBinaryView;
                KHR_binary_glTF.bufferView = bufferViewId; //Create bufferview
                bufferViews[bufferViewId] = {
                    "buffer": "binary_glTF",
                    "byteLength": shader.extras._pipeline.source.length,
                    "byteOffset": currentOffset
                };
                currentOffset += shader.extras._pipeline.source.length;

                body = Buffer.concat([body, shader.extras._pipeline.source]);
            }
        }
    }

    //Create binary scene from the glTF object
    var sceneString = JSON.stringify(gltf);
    var sceneLength = Buffer.byteLength(sceneString);
    sceneLength += 4 - (sceneLength % 4);
    var padding = new Array(sceneLength + 1).join(' ');
    sceneString = (sceneString + padding).substring(0, sceneLength);
    var bodyOffset = 20 + sceneLength;
    var glbLength = bodyOffset + body.length;
    var glb = new Buffer(bodyOffset);
    
    //Write binary glTF header (magic, version, length, sceneLength, sceneFormat)
    glb.write('glTF', 0);
    glb.writeUInt32LE(1, 4);
    glb.writeUInt32LE(glbLength, 8);
    glb.writeUInt32LE(sceneLength, 12);
    glb.writeUInt32LE(0, 16);
    glb.write(sceneString, 20);
    glb = Buffer.concat([glb, body], glbLength);

    fs.writeFile(outputPath, glb, function (err) {
        if (err) {
            throw err;
        }
    });
}