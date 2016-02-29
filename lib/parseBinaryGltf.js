'use strict';
var fs = require('fs');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var StringDecoder = require('string_decoder').StringDecoder;
module.exports = parseBinaryGltf;

function parseBinaryGltf(data) {
    var sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;
    var byteOffset = 0;
    // console.log(data.slice(0, 5*sizeOfUint32));

    if (data.slice(byteOffset, sizeOfUint32).toString() !== 'glTF') {
        throw new Error('File is not valid binary glTF');
    }

    byteOffset += 3*sizeOfUint32;
    var dataView = new DataView(data.buffer);
    var sceneLength = dataView.getUint32(byteOffset, true);

    byteOffset += 2*sizeOfUint32;
    var decoder = new StringDecoder();
    var scene = decoder.write(data.slice(byteOffset, byteOffset + sceneLength));
    var gltf = JSON.parse(scene);
    // console.log(data.slice(byteOffset, byteOffset + sceneLength));

    byteOffset += sceneLength;
    var body = data.slice(byteOffset);
    var buffers = gltf.buffers;
    if (defined(buffers)) {
        if (defined(buffers.KHR_binary_glTF || defined(buffers.binary_glTF))) {
            var buffer = defaultValue(buffers.KHR_binary_glTF, buffers.binary_glTF);
            buffer.extras = defaultValue(buffer.extras, {});
            buffer.extras.source = body;
        }
    }

    if (defined(gltf.extensionsUsed) && gltf.extensionsUsed.indexOf("KHR_binary_glTF") > -1) {
        loadSourceFromBody(gltf, body, 'images');
        loadSourceFromBody(gltf, body, 'shaders');
    }

    return gltf;
}

function loadSourceFromBody(gltf, body, name) {
    var objects = gltf[name];
    if (defined(objects)) {
        for (var objectId in objects) {
            var object = objects[objectId];
            var objectExtensions = object.extensions;
            if (defined(objectExtensions) && defined(objectExtensions.KHR_binary_glTF)) {
                var objectView = objectExtensions.KHR_binary_glTF.bufferView;
                var bufferView = gltf.bufferViews[objectView];
                var source = body.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                object.extras = defaultValue(object.extras, {});
                object.extras.source = source;
            }
        }
    }
}