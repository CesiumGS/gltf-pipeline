"use strict";
const Cesium = require("cesium");
const fsExtra = require("fs-extra");
const path = require("path");
const Promise = require("bluebird");
const { URL } = require("url");

const addPipelineExtras = require("./addPipelineExtras");
const dataUriToBuffer = require("./dataUriToBuffer");
const { fileURLToPath, pathToFileURL } = require("./FileUrl");
const ForEach = require("./ForEach");

const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const isDataUri = Cesium.isDataUri;
const RuntimeError = Cesium.RuntimeError;

module.exports = readResources;

/**
 * Read data uris, buffer views, or files referenced by the glTF into buffers.
 * The buffer data is placed into extras._pipeline.source for the corresponding object.
 * This stage runs before updateVersion and handles both glTF 1.0 and glTF 2.0 assets.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Object with the following properties:
 * @param {String} [options.resourceDirectory] The path to look in when reading separate files.
 * @returns {Promise} A promise that resolves to the glTF asset when all resources are read.
 *
 * @private
 */
function readResources(gltf, options) {
  addPipelineExtras(gltf);
  options = defaultValue(options, {});

  // Make sure its an absolute path with a trailing separator
  options.resourceDirectory = defined(options.resourceDirectory)
    ? path.resolve(options.resourceDirectory) + path.sep
    : undefined;

  const bufferPromises = [];
  const resourcePromises = [];

  ForEach.buffer(gltf, function (buffer) {
    bufferPromises.push(readBuffer(gltf, buffer, options));
  });

  // Buffers need to be read first because images and shader may resolve to bufferViews
  return Promise.all(bufferPromises)
    .then(function () {
      ForEach.shader(gltf, function (shader) {
        resourcePromises.push(readShader(gltf, shader, options));
      });
      ForEach.image(gltf, function (image) {
        resourcePromises.push(readImage(gltf, image, options));
      });
      return Promise.all(resourcePromises);
    })
    .then(function () {
      return gltf;
    });
}

function readBuffer(gltf, buffer, options) {
  return readResource(gltf, buffer, false, options).then(function (data) {
    if (defined(data)) {
      buffer.extras._pipeline.source = data;
    }
  });
}

function readImage(gltf, image, options) {
  return readResource(gltf, image, true, options).then(function (data) {
    image.extras._pipeline.source = data;
  });
}

function readShader(gltf, shader, options) {
  return readResource(gltf, shader, true, options).then(function (data) {
    shader.extras._pipeline.source = data.toString();
  });
}

function readResource(gltf, object, saveResourceId, options) {
  const uri = object.uri;
  delete object.uri; // Don't hold onto the uri, its contents will be stored in extras._pipeline.source

  // Source already exists if the gltf was converted from a glb
  const source = object.extras._pipeline.source;
  if (defined(source)) {
    return Promise.resolve(Buffer.from(source));
  }
  // Handle reading buffer view from 1.0 glb model
  const extensions = object.extensions;
  if (defined(extensions)) {
    const khrBinaryGltf = extensions.KHR_binary_glTF;
    if (defined(khrBinaryGltf)) {
      return Promise.resolve(
        readBufferView(gltf, khrBinaryGltf.bufferView, object, saveResourceId)
      );
    }
  }
  if (defined(object.bufferView)) {
    return Promise.resolve(
      readBufferView(gltf, object.bufferView, object, saveResourceId)
    );
  }
  if (!defined(uri)) {
    return Promise.resolve(undefined);
  }
  if (isDataUri(uri)) {
    return Promise.resolve(dataUriToBuffer(uri));
  }
  return readFile(object, uri, saveResourceId, options);
}

function readBufferView(gltf, bufferViewId, object, saveResourceId) {
  if (saveResourceId) {
    object.extras._pipeline.resourceId = bufferViewId;
  }
  const bufferView = gltf.bufferViews[bufferViewId];
  const buffer = gltf.buffers[bufferView.buffer];
  const source = buffer.extras._pipeline.source;
  const byteOffset = defaultValue(bufferView.byteOffset, 0);
  return source.slice(byteOffset, byteOffset + bufferView.byteLength);
}

function readFile(object, uri, saveResourceId, options) {
  const resourceDirectory = options.resourceDirectory;
  const hasResourceDirectory = defined(resourceDirectory);

  // Resolve the URL
  let absoluteUrl;
  try {
    absoluteUrl = new URL(
      uri,
      hasResourceDirectory ? pathToFileURL(resourceDirectory) : undefined
    );
  } catch (error) {
    return Promise.reject(
      new RuntimeError(
        "glTF model references separate files but no resourceDirectory is supplied"
      )
    );
  }

  // Generate file paths for the resource
  const absolutePath = fileURLToPath(absoluteUrl);
  const relativePath = hasResourceDirectory
    ? path.relative(resourceDirectory, absolutePath)
    : path.basename(absolutePath);

  if (!defined(object.name)) {
    const extension = path.extname(relativePath);
    object.name = path.basename(relativePath, extension);
  }

  if (saveResourceId) {
    object.extras._pipeline.resourceId = absolutePath;
  }

  object.extras._pipeline.absolutePath = absolutePath;
  object.extras._pipeline.relativePath = relativePath;
  return fsExtra.readFile(absolutePath);
}
