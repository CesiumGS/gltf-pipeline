'use strict';
var fs = require('fs');
var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var objectValues = require('object-values');
var StringDecoder = require('string_decoder').StringDecoder;
module.exports = parseBinaryGltf;

function parseBinaryGltf(data) {
    var sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;
    var byteOffset = 0;

    //Check that the magic string is present
    if (data.slice(byteOffset, sizeOfUint32).toString() !== 'glTF') {
        throw new DeveloperError('File is not valid binary glTF');
    }

    //Check that the version is 1
    byteOffset += sizeOfUint32;
    if (data.readInt32LE(byteOffset) !== 1) {
        throw new DeveloperError('Binary glTF version is not 1');
    }

    //Get the length of the glTF scene
    byteOffset += 2*sizeOfUint32;
    var dataView = new DataView(data.buffer);
    var sceneLength = dataView.getUint32(byteOffset, true);

    //Check that the scene format is 0, indicating that it is JSON
    byteOffset += sizeOfUint32;
    if (data.readInt32LE(byteOffset) !== 0) {
        throw new DeveloperError('Binary glTF scene format is not JSON');
    }

    byteOffset += sizeOfUint32;
    var decoder = new StringDecoder();
    var scene = decoder.write(data.slice(byteOffset, byteOffset + sceneLength));
    var gltf = JSON.parse(scene);

    byteOffset += sceneLength;
    var body = data.slice(byteOffset);
    
    //Find bufferViews used by accessors
    var usedBufferViews = getUsedBufferViews(gltf);

    //Add image and shader sources, and delete their bufferView if not by an accessor
    loadSourceFromBody(gltf, body, 'images', usedBufferViews);
    loadSourceFromBody(gltf, body, 'shaders', usedBufferViews);

    //Create a new buffer for each bufferView, and delete the original body buffer
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;
    if (defined(buffers) && defined(buffers.binary_glTF)) {
        var buffer = buffers.binary_glTF;
        if (defined(bufferViews)) {
            //Add id to each bufferView object
            for (var bufferViewId in bufferViews) {
                if (bufferViews.hasOwnProperty(bufferViewId)) {
                    var bufferView = bufferViews[bufferViewId];
                    bufferView.extras = defaultValue(bufferView.extras, {});
                    bufferView.extras.id = bufferViewId;
                }
            }

            //Create bufferView array and sort by increasing byteOffset
            var bufferViewArray = objectValues(bufferViews);
            bufferViewArray.sort(function(a, b) {
                return a.byteOffset - b.byteOffset;
            });
            //Get bufferViews referencing binary_glTF
            bufferViewArray = bufferViewArray.filter(function(bufferView) {
                return bufferView.buffer === 'binary_glTF';
            });
            for (var i = 0; i < bufferViewArray.length; i++) {
                var currentView = bufferViewArray[i];
                var viewStart = currentView.byteOffset;
                var viewLength = defaultValue(currentView.byteLength, 0);
                var viewEnd = viewStart + viewLength;
                currentView.byteOffset = 0;
                currentView.byteLength = viewLength;
                
                var bufferName = currentView.extras.id + '_buffer';
                var bufferKeys = Object.keys(buffers);
                while (bufferKeys.indexOf(bufferName) != -1) {
                    bufferName += '_';
                }
                currentView.buffer = bufferName;
                
                var j = i + 1;
                while (j < bufferViewArray.length && j < bufferViewArray.length) {
                    var nextView = bufferViewArray[j];
                    var nextViewStart = nextView.byteOffset;
                    var nextViewLength = defaultValue(nextView.byteLength, 0);
                    var nextViewEnd = nextViewStart + nextViewLength;
                    //Merge views if they overlap
                    if (nextViewStart < viewEnd) {
                        nextView.byteOffset = nextViewStart - viewStart;
                        nextView.byteLength = nextViewLength;
                        nextView.buffer = bufferName;
                        delete nextView.extras.id;
                        if (nextViewEnd > viewEnd) {
                            viewEnd = nextViewEnd;
                        }
                    }
                    else {
                        break;
                    }
                }

                buffers[bufferName] = {
                    "byteLength": viewEnd - viewStart,
                    "uri": "data:,",
                    "extras": {
                        "source": body.slice(viewStart, viewEnd)
                    }
                };
                delete currentView.extras.id;
            }
        }
        delete gltf.buffers.binary_glTF;
    }

    

    return gltf;
}

function loadSourceFromBody(gltf, body, name, usedBufferViews) {
    var objects = gltf[name];
    if (defined(objects)) {
        for (var objectId in objects) {
            if (objects.hasOwnProperty(objectId)) {
                var object = objects[objectId];
                var objectExtensions = object.extensions;
                if (defined(objectExtensions) && defined(objectExtensions.KHR_binary_glTF)) {
                    var viewId = objectExtensions.KHR_binary_glTF.bufferView;
                    var bufferView = gltf.bufferViews[viewId];
                    var source = body.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                    object.extras = defaultValue(object.extras, {});
                    object.extras.source = source;

                    delete object.extensions.KHR_binary_glTF;
                    if (!defined(usedBufferViews[viewId])) {
                        delete gltf.bufferViews[viewId];
                    }
                }
            }
        }
    }
}

function getUsedBufferViews(gltf) {
    var usedBufferViews = {};
    var accessors = gltf.accessors;

    if (defined(accessors)) {
        for (var accessorId in accessors) {
            if (accessors.hasOwnProperty(accessorId)){
                usedBufferViews[accessors[accessorId].bufferView] = true;
            }
        }
    }

    return usedBufferViews;
}