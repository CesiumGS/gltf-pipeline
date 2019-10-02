'use strict';
const Cesium = require('cesium');
const mime = require('mime');
const addBuffer = require('./addBuffer');
const ForEach = require('./ForEach');
const getImageExtension = require('./getImageExtension');
const mergeBuffers = require('./mergeBuffers');
const removeUnusedElements = require('./removeUnusedElements');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const WebGLConstants = Cesium.WebGLConstants;

// .crn (Crunch) is not a supported mime type, so add it
mime.define({'image/crn': ['crn']}, true);

// .glsl shaders are text/plain type
mime.define({'text/plain': ['glsl']}, true);

// .basis is not a supported mime type, so add it
mime.define({'image/basis': ['basis']}, true);

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
 * @param {Boolean} [options.dracoOptions.uncompressedFallback=false] If set, add uncompressed fallback versions of the compressed meshes.
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
    removeUnusedElements(gltf, ['acessor', 'bufferView', 'buffer']);
    mergeBuffers(gltf, options.name);

    ForEach.buffer(gltf, function(buffer, bufferId) {
        writeBuffer(gltf, buffer, bufferId, options);
    });
    return gltf;
}

function writeBuffer(gltf, buffer, i, options) {
    if (defined(options.bufferStorage) && !options.separateBuffers) {
        writeBufferStorage(buffer, options);
    } else {
        writeResource(gltf, buffer, i, options.separateBuffers, true, '.bin', options);
    }
}

function writeBufferStorage(buffer, options) {
    let combinedBuffer = options.bufferStorage.buffer;
    combinedBuffer = defined(combinedBuffer) ? combinedBuffer : Buffer.alloc(0);
    combinedBuffer = Buffer.concat([combinedBuffer, buffer.extras._pipeline.source]);
    options.bufferStorage.buffer = combinedBuffer;
}

function writeImage(gltf, image, i, options) {
    const extension = getImageExtension(image.extras._pipeline.source);
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
    const source = object.extras._pipeline.source;
    const mimeType = mime.getType(extension);
    object.uri = 'data:' + mimeType + ';base64,' + source.toString('base64');
}

function writeBufferView(gltf, object) {
    delete object.uri;
    let source = object.extras._pipeline.source;
    if (typeof source === 'string') {
        source = Buffer.from(source);
    }
    object.bufferView = addBuffer(gltf, source);
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
    const gltfName = options.name;
    const objectName = object.name;

    if (defined(objectName)) {
        return objectName;
    } else if (extension === '.bin') {
        if (defined(gltfName)) {
            return gltfName + index;
        }
        return 'buffer' + index;
    } else if (extension === '.glsl') {
        const programInfo = getProgram(gltf, index);
        const program = programInfo.program;
        const programIndex = programInfo.index;
        const programName = program.name;
        const shaderType = object.type === WebGLConstants.FRAGMENT_SHADER ? 'FS' : 'VS';
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
    const pipelineExtras = object.extras._pipeline;
    let relativePath = pipelineExtras.relativePath;
    if (defined(relativePath)) {
        return relativePath.replace(/\\/g, '/');
    }

    const name = getName(gltf, object, index, extension, options);
    relativePath = name + extension;

    // Check if a file of the same name already exists, and if so, append a number
    let number = 1;
    while (defined(options.separateResources[relativePath])) {
        relativePath = name + '_' + number + extension;
        number++;
    }
    return relativePath;
}

function writeFile(gltf, object, index, extension, options) {
    delete object.bufferView;
    const source = object.extras._pipeline.source;
    const relativePath = getRelativePath(gltf, object, index, extension, options);
    object.uri = relativePath;
    if (defined(options.separateResources)) {
        options.separateResources[relativePath] = source;
    }
}
