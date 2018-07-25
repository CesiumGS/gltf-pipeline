'use strict';
var Cesium = require('cesium');
var mime = require('mime');
var ForEach = require('./ForEach');
var getImageExtension = require('./getImageExtension');
var mergeBuffers = require('./mergeBuffers');
var removeUnusedElements = require('./removeUnusedElements');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

// .crn (Crunch) is not a supported mime type, so add it
mime.define({'image/crn': ['crn']}, true);

// .glsl shaders are text/plain type
mime.define({'text/plain': ['glsl']}, true);

module.exports = writeResources;

/**
 * Write glTF resources as data uris, buffer views, or files.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Object with the following properties:
 * @param {String} [options.name] The name of the glTF asset, for writing separate resources.
 * @param {Boolean} [options.separateBuffers=false] Whether to save buffers as separate files.
 * @param {Boolean} [options.separateShaders=false] Whether to save shaders as separate files.
 * @param {Boolean} [options.separateTextures=false] Whether to save images as separate files.
 * @param {Boolean} [options.dataUris=false] Write embedded resources as data uris instead of buffer views.
 * @param {Object} [options.bufferStorage] When defined, the glTF buffer's underlying Buffer object will be saved here instead of encoded as a data uri or saved as a separate resource.
 * @param {Object} [options.separateResources] When defined, buffers of separate resources will be saved here.
 * @returns {Object} The glTF asset.
 *
 * @private
 */
function writeResources(gltf, options) {
    options = defaultValue(options, {});
    options.separateBuffers = defaultValue(options.separateBuffers, false);
    options.separateTextures = defaultValue(options.separateTextures, false);
    options.separateShaders = defaultValue(options.separateShaders, false);
    options.dataUris = defaultValue(options.dataUris, false);

    ForEach.image(gltf, function(image, i) {
        writeImage(gltf, image, i, options);
        ForEach.compressedImage(image, function(compressedImage) {
            writeImage(gltf, compressedImage, i, options);
        });
    });

    ForEach.shader(gltf, function(shader, i) {
        writeShader(gltf, shader, i, options);
    });

    // Buffers need to be written last because images and shaders may write to new buffers
    removeUnusedElements(gltf);
    mergeBuffers(gltf);
    writeBuffer(gltf, gltf.buffers[0], 0, options);
    return gltf;
}

function writeBuffer(gltf, buffer, i, options) {
    if (defined(options.bufferStorage)) {
        options.bufferStorage.buffer = buffer.extras._pipeline.source;
    }
    writeResource(gltf, buffer, i, options.separateBuffers, true, '.bin', options);
}

function writeImage(gltf, image, i, options) {
    var extension = getImageExtension(image.extras._pipeline.source);
    writeResource(gltf, image, i, options.separateTextures, options.dataUris, extension, options);
    if (defined(image.bufferView)) {
        // Preserve the image mime type when writing to a buffer view
        image.mimeType = mime.getType(extension);
    }
}

function writeShader(gltf, shader, i, options) {
    writeResource(gltf, shader, i, options.separateShaders, options.dataUris, '.glsl', options);
}

function writeResource(gltf, object, index, separate, dataUris, extension, options) {
    if (separate) {
        writeFile(gltf, object, index, extension, options);
    } else if (dataUris) {
        writeDataUri(object, extension);
    } else {
        writeBufferView(gltf, object);
    }
}

function writeDataUri(object, extension) {
    delete object.bufferView;
    var source = object.extras._pipeline.source;
    var mimeType = mime.getType(extension);
    object.uri = 'data:' + mimeType + ';base64,' + source.toString('base64');
}

function writeBufferView(gltf, object) {
    delete object.uri;
    var source = object.extras._pipeline.source;
    if (typeof source === 'string') {
        source = Buffer.from(source);
    }
    var byteLength = source.length;
    var buffers = gltf.buffers;
    var bufferViews = gltf.bufferViews;

    object.bufferView = bufferViews.length;
    bufferViews.push({
        buffer: buffers.length,
        byteOffset: 0,
        byteLength: byteLength
    });
    buffers.push({
        byteLength: byteLength,
        extras: {
            _pipeline: {
                source: source
            }
        }
    });
}

function getProgram(gltf, shaderIndex) {
    return ForEach.program(gltf, function(program, index) {
        if (program.fragmentShader === shaderIndex || program.vertexShader === shaderIndex) {
            return {
                program: program,
                index: index
            };
        }
    });
}

function getName(gltf, object, index, extension, options) {
    var gltfName = options.name;
    var objectName = object.name;

    if (defined(objectName)) {
        return objectName;
    } else if (extension === '.bin') {
        if (defined(gltfName)) {
            return gltfName;
        }
        return 'buffer';
    } else if (extension === '.glsl') {
        var programInfo = getProgram(gltf, index);
        var program = programInfo.program;
        var programIndex = programInfo.index;
        var programName = program.name;
        var shaderType = object.type === WebGLConstants.FRAGMENT_SHADER ? 'FS' : 'VS';
        if (defined(programName)) {
            return programName + shaderType;
        } else if (defined(gltfName)) {
            return gltfName + shaderType + programIndex;
        }
        return shaderType.toLowerCase() + programIndex;
    }

    // Otherwise is an image
    if (defined(gltfName)) {
        return gltfName + index;
    }
    return 'image' + index;
}

function getRelativePath(gltf, object, index, extension, options) {
    var pipelineExtras = object.extras._pipeline;
    var relativePath = pipelineExtras.relativePath;
    if (defined(relativePath)) {
        return relativePath.replace(/\\/g, '/');
    }

    var name = getName(gltf, object, index, extension, options);
    relativePath = name + extension;

    // Check if a file of the same name already exists, and if so, append a number
    var number = 1;
    while (defined(options.separateResources[relativePath])) {
        relativePath = name + '_' + number + extension;
    }
    return relativePath;
}

function writeFile(gltf, object, index, extension, options) {
    delete object.bufferView;
    var source = object.extras._pipeline.source;
    var relativePath = getRelativePath(gltf, object, index, extension, options);
    object.uri = relativePath;
    if (defined(options.separateResources)) {
        options.separateResources[relativePath] = source;
    }
}
