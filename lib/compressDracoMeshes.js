"use strict";
const Cesium = require("cesium");
const draco3d = require("draco3d");
const hashObject = require("object-hash");
const Promise = require("bluebird");
const addBuffer = require("./addBuffer");
const addExtensionsRequired = require("./addExtensionsRequired");
const addExtensionsUsed = require("./addExtensionsUsed");
const addToArray = require("./addToArray");
const ForEach = require("./ForEach");
const numberOfComponentsForType = require("./numberOfComponentsForType");
const readAccessorPacked = require("./readAccessorPacked");
const removeUnusedElements = require("./removeUnusedElements");
const replaceWithDecompressedPrimitive = require("./replaceWithDecompressedPrimitive");
const splitPrimitives = require("./splitPrimitives");

const Cartesian3 = Cesium.Cartesian3;
const Check = Cesium.Check;
const clone = Cesium.clone;
const ComponentDatatype = Cesium.ComponentDatatype;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const RuntimeError = Cesium.RuntimeError;
const WebGLConstants = Cesium.WebGLConstants;

let encoderModulePromise;
let decoderModulePromise;

module.exports = compressDracoMeshes;

/**
 * Compresses meshes using Draco compression in the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options The same options object as {@link processGltf}
 * @param {Object} options.dracoOptions Options defining Draco compression settings.
 * @param {Number} [options.dracoOptions.compressionLevel=7] A value between 0 and 10 specifying the quality of the Draco compression. Higher values produce better quality compression but may take longer to decompress. A value of 0 will apply sequential encoding and preserve face order.
 * @param {Number} [options.dracoOptions.quantizePositionBits=11] A value between 0 and 30 specifying the number of bits used for positions. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeNormalBits=8] A value between 0 and 30 specifying the number of bits used for normals. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeTexcoordBits=10] A value between 0 and 30 specifying the number of bits used for texture coordinates. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeColorBits=8] A value between 0 and 30 specifying the number of bits used for color attributes. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeGenericBits=8] A value between 0 and 30 specifying the number of bits used for skinning attributes (joint indices and joint weights) and custom attributes. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Boolean} [options.dracoOptions.uncompressedFallback=false] If set, add uncompressed fallback versions of the compressed meshes.
 * @param {Boolean} [options.dracoOptions.unifiedQuantization=false] Quantize positions, defined by the unified bounding box of all primitives. If not set, quantization is applied separately.
 * @param {Object} [options.dracoOptions.quantizationVolume] An AxisAlignedBoundingBox defining the explicit quantization volume.
 * @returns {Promise} A promise that resolves to the glTF asset with compressed meshes.
 *
 * @private
 */
function compressDracoMeshes(gltf, options) {
  if (!defined(encoderModulePromise)) {
    // Prepare encoder for compressing meshes.
    encoderModulePromise = Promise.resolve(draco3d.createEncoderModule({}));
    decoderModulePromise = Promise.resolve(draco3d.createDecoderModule({}));
  }

  return encoderModulePromise.then(function (encoderModule) {
    return decoderModulePromise.then(function (decoderModule) {
      return compress(gltf, options, encoderModule, decoderModule);
    });
  });
}

function compress(gltf, options, encoderModule, decoderModule) {
  options = defaultValue(options, {});
  const dracoOptions = defaultValue(options.dracoOptions, {});
  const defaults = compressDracoMeshes.defaults;
  const compressionLevel = defaultValue(
    dracoOptions.compressionLevel,
    defaults.compressionLevel
  );
  const uncompressedFallback = defaultValue(
    dracoOptions.uncompressedFallback,
    defaults.uncompressedFallback
  );
  const unifiedQuantization = defaultValue(
    dracoOptions.unifiedQuantization,
    defaults.unifiedQuantization
  );
  const quantizationVolume = dracoOptions.quantizationVolume;
  const explicitQuantization =
    unifiedQuantization || defined(quantizationVolume);
  const quantizationBitsValues = getQuantizationBits(dracoOptions);

  checkRange("compressionLevel", compressionLevel, 0, 10);
  for (const attributeName in quantizationBitsValues) {
    if (
      Object.prototype.hasOwnProperty.call(
        quantizationBitsValues,
        attributeName
      )
    ) {
      checkRange(
        `quantizationBitsValues[${attributeName}]`,
        quantizationBitsValues[attributeName],
        0,
        30
      );
    }
  }

  splitPrimitives(gltf);

  const hashPrimitives = {};
  let positionOrigin;
  let positionRange;

  if (defined(quantizationVolume)) {
    positionOrigin = Cartesian3.pack(quantizationVolume.minimum, new Array(3));
    positionRange = Cartesian3.maximumComponent(
      Cartesian3.subtract(
        quantizationVolume.maximum,
        quantizationVolume.minimum,
        new Cartesian3()
      )
    );
  } else if (unifiedQuantization) {
    // Collect bounding box from all primitives. Currently works only for vec3 positions (XYZ).
    const accessors = gltf.accessors;
    const min = new Array(3).fill(Number.POSITIVE_INFINITY);
    const max = new Array(3).fill(Number.NEGATIVE_INFINITY);
    ForEach.accessorWithSemantic(gltf, "POSITION", function (accessorId) {
      const accessor = accessors[accessorId];
      if (accessor.type !== "VEC3") {
        throw new RuntimeError(
          "Could not perform unified quantization. Input contains position accessor with an unsupported number of components."
        );
      }
      const accessorMin = accessor.min;
      const accessorMax = accessor.max;
      for (let j = 0; j < 3; ++j) {
        min[j] = Math.min(min[j], accessorMin[j]);
        max[j] = Math.max(max[j], accessorMax[j]);
      }
    });
    positionOrigin = min;
    positionRange = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  }

  let addedExtension = false;

  ForEach.mesh(gltf, function (mesh) {
    ForEach.meshPrimitive(mesh, function (primitive) {
      if (
        defined(primitive.mode) &&
        primitive.mode !== WebGLConstants.TRIANGLES
      ) {
        return;
      }
      if (!defined(primitive.indices)) {
        addIndices(gltf, primitive);
      }

      addedExtension = true;

      const primitiveGeometry = {
        attributes: primitive.attributes,
        indices: primitive.indices,
        mode: primitive.mode,
      };
      const hashValue = hashObject(primitiveGeometry);
      if (defined(hashPrimitives[hashValue])) {
        // Copy compressed primitive.
        copyCompressedExtensionToPrimitive(
          primitive,
          hashPrimitives[hashValue]
        );
        return;
      }
      hashPrimitives[hashValue] = primitive;

      const encoder = new encoderModule.Encoder();
      const meshBuilder = new encoderModule.MeshBuilder();
      const mesh = new encoderModule.Mesh();

      // First get the faces and add to geometry.
      const indicesData = readAccessorPacked(
        gltf,
        gltf.accessors[primitive.indices]
      );
      const indices = new Uint32Array(indicesData);
      const numberOfFaces = indices.length / 3;
      meshBuilder.AddFacesToMesh(mesh, numberOfFaces, indices);

      // Add attributes to mesh.
      const attributeToId = {};
      ForEach.meshPrimitiveAttribute(
        primitive,
        function (accessorId, semantic) {
          const accessor = gltf.accessors[accessorId];
          const componentType = accessor.componentType;
          const numberOfPoints = accessor.count;
          const numberOfComponents = numberOfComponentsForType(accessor.type);
          const packed = readAccessorPacked(gltf, accessor);
          const addAttributeFunctionName =
            getAddAttributeFunctionName(componentType);
          const data = ComponentDatatype.createTypedArray(
            componentType,
            packed
          );

          let attributeName = semantic;
          if (semantic.indexOf("_") > 0) {
            // Skip user-defined semantics prefixed with underscore
            attributeName = attributeName.substring(0, semantic.indexOf("_"));
          }

          let attributeEnum;
          if (
            attributeName === "POSITION" ||
            attributeName === "NORMAL" ||
            attributeName === "COLOR"
          ) {
            attributeEnum = encoderModule[attributeName];
          } else if (attributeName === "TEXCOORD") {
            attributeEnum = encoderModule.TEX_COORD;
          } else {
            attributeEnum = encoderModule.GENERIC;
          }

          const attributeId = meshBuilder[addAttributeFunctionName](
            mesh,
            attributeEnum,
            numberOfPoints,
            numberOfComponents,
            data
          );

          if (attributeId === -1) {
            throw new RuntimeError(
              `Error: Failed adding attribute ${semantic}`
            );
          } else {
            attributeToId[semantic] = attributeId;
          }
          if (quantizationBitsValues[attributeName] > 0) {
            if (attributeName === "POSITION" && explicitQuantization) {
              encoder.SetAttributeExplicitQuantization(
                encoderModule.POSITION,
                quantizationBitsValues[attributeName],
                3,
                positionOrigin,
                positionRange
              );
            } else {
              encoder.SetAttributeQuantization(
                attributeEnum,
                quantizationBitsValues[attributeName]
              );
            }
          }
        }
      );

      const encodedDracoDataArray = new encoderModule.DracoInt8Array();
      encoder.SetSpeedOptions(10 - compressionLevel, 10 - compressionLevel); // Compression level is 10 - speed.

      if (defined(primitive.targets)) {
        // Set sequential encoding to preserve order of vertices.
        encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
      }

      encoder.SetTrackEncodedProperties(true);
      const encodedLength = encoder.EncodeMeshToDracoBuffer(
        mesh,
        encodedDracoDataArray
      );
      if (encodedLength <= 0) {
        throw new RuntimeError("Error: Draco encoding failed.");
      }

      const encodedData = Buffer.alloc(encodedLength);
      for (let i = 0; i < encodedLength; ++i) {
        encodedData[i] = encodedDracoDataArray.GetValue(i);
      }

      const dracoEncodedBuffer = {
        buffer: encodedData,
        numberOfPoints: encoder.GetNumberOfEncodedPoints(),
        numberOfFaces: encoder.GetNumberOfEncodedFaces(),
      };
      addCompressionExtensionToPrimitive(
        gltf,
        primitive,
        attributeToId,
        dracoEncodedBuffer,
        uncompressedFallback,
        quantizationBitsValues,
        decoderModule
      );

      encoderModule.destroy(encodedDracoDataArray);
      encoderModule.destroy(mesh);
      encoderModule.destroy(meshBuilder);
      encoderModule.destroy(encoder);
    });
  });

  if (addedExtension) {
    if (uncompressedFallback) {
      addExtensionsUsed(gltf, "KHR_draco_mesh_compression");
    } else {
      addExtensionsRequired(gltf, "KHR_draco_mesh_compression");
    }
    removeUnusedElements(gltf, ["accessor", "bufferView", "buffer"]);

    if (uncompressedFallback) {
      assignMergedBufferNames(gltf);
    }
  }

  return gltf;
}

function addIndices(gltf, primitive) {
  // Reserve the 65535 index for primitive restart
  const length = gltf.accessors[primitive.attributes.POSITION].count;
  const componentType =
    length < 65535
      ? WebGLConstants.UNSIGNED_SHORT
      : WebGLConstants.UNSIGNED_INT;
  const array = ComponentDatatype.createTypedArray(componentType, length);
  for (let i = 0; i < length; ++i) {
    array[i] = i;
  }
  const buffer = Buffer.from(array.buffer);
  const bufferView = addBuffer(gltf, buffer);
  const accessor = {
    bufferView: bufferView,
    byteOffset: 0,
    componentType: componentType,
    count: length,
    type: "SCALAR",
    min: [0],
    max: [length - 1],
  };
  primitive.indices = addToArray(gltf.accessors, accessor);
}

function addCompressionExtensionToPrimitive(
  gltf,
  primitive,
  attributeToId,
  dracoEncodedBuffer,
  uncompressedFallback,
  quantizationBitsValues,
  decoderModule
) {
  if (!uncompressedFallback) {
    // Remove properties from accessors.
    // Remove indices bufferView.
    const indicesAccessor = clone(gltf.accessors[primitive.indices]);
    delete indicesAccessor.bufferView;
    delete indicesAccessor.byteOffset;
    primitive.indices = addToArray(gltf.accessors, indicesAccessor);

    // Remove attributes bufferViews.
    ForEach.meshPrimitiveAttribute(primitive, function (accessorId, semantic) {
      const attributeAccessor = clone(gltf.accessors[accessorId]);
      delete attributeAccessor.bufferView;
      delete attributeAccessor.byteOffset;
      primitive.attributes[semantic] = addToArray(
        gltf.accessors,
        attributeAccessor
      );
    });
  }

  const bufferViewId = addBuffer(gltf, dracoEncodedBuffer.buffer);

  primitive.extensions = defaultValue(primitive.extensions, {});
  primitive.extensions.KHR_draco_mesh_compression = {
    bufferView: bufferViewId,
    attributes: attributeToId,
  };

  gltf = replaceWithDecompressedPrimitive(
    gltf,
    primitive,
    dracoEncodedBuffer,
    uncompressedFallback,
    quantizationBitsValues,
    decoderModule
  );
}

function copyCompressedExtensionToPrimitive(primitive, compressedPrimitive) {
  ForEach.meshPrimitiveAttribute(
    compressedPrimitive,
    function (accessorId, semantic) {
      primitive.attributes[semantic] = accessorId;
    }
  );
  primitive.indices = compressedPrimitive.indices;

  const dracoExtension =
    compressedPrimitive.extensions.KHR_draco_mesh_compression;
  primitive.extensions = defaultValue(primitive.extensions, {});
  primitive.extensions.KHR_draco_mesh_compression = {
    bufferView: dracoExtension.bufferView,
    attributes: dracoExtension.attributes,
  };
}

function assignBufferViewName(gltf, bufferViewId, name) {
  const bufferView = gltf.bufferViews[bufferViewId];
  const buffer = gltf.buffers[bufferView.buffer];
  buffer.extras._pipeline.mergedBufferName = name;
}

function assignAccessorName(gltf, accessorId, name) {
  const bufferViewId = gltf.accessors[accessorId].bufferView;
  if (defined(bufferViewId)) {
    assignBufferViewName(gltf, bufferViewId, name);
  }
}

function assignMergedBufferNames(gltf) {
  ForEach.accessorContainingVertexAttributeData(gltf, function (accessorId) {
    assignAccessorName(gltf, accessorId, "uncompressed");
  });
  ForEach.accessorContainingIndexData(gltf, function (accessorId) {
    assignAccessorName(gltf, accessorId, "uncompressed");
  });
  ForEach.mesh(gltf, function (mesh) {
    ForEach.meshPrimitive(mesh, function (primitive) {
      if (
        defined(primitive.extensions) &&
        defined(primitive.extensions.KHR_draco_mesh_compression)
      ) {
        assignBufferViewName(
          gltf,
          primitive.extensions.KHR_draco_mesh_compression.bufferView,
          "draco"
        );
      }
    });
  });
}

function getAddAttributeFunctionName(componentType) {
  switch (componentType) {
    case WebGLConstants.UNSIGNED_BYTE:
      return "AddUInt8Attribute";
    case WebGLConstants.BYTE:
      return "AddInt8Attribute";
    case WebGLConstants.UNSIGNED_SHORT:
      return "AddUInt16Attribute";
    case WebGLConstants.SHORT:
      return "AddInt16Attribute";
    case WebGLConstants.UNSIGNED_INT:
      return "AddUInt32Attribute";
    case WebGLConstants.INT:
      return "AddInt32Attribute";
    case WebGLConstants.FLOAT:
      return "AddFloatAttribute";
  }
}

function checkRange(name, value, minimum, maximum) {
  Check.typeOf.number.greaterThanOrEquals(name, value, minimum);
  Check.typeOf.number.lessThanOrEquals(name, value, maximum);
}

function getQuantizationBits(dracoOptions) {
  const defaults = compressDracoMeshes.defaults;
  return {
    POSITION: defaultValue(
      dracoOptions.quantizePositionBits,
      defaults.quantizePositionBits
    ),
    NORMAL: defaultValue(
      dracoOptions.quantizeNormalBits,
      defaults.quantizeNormalBits
    ),
    TEXCOORD: defaultValue(
      dracoOptions.quantizeTexcoordBits,
      defaults.quantizeTexcoordBits
    ),
    COLOR: defaultValue(
      dracoOptions.quantizeColorBits,
      defaults.quantizeColorBits
    ),
    GENERIC: defaultValue(
      dracoOptions.quantizeGenericBits,
      defaults.quantizeGenericBits
    ),
  };
}

compressDracoMeshes.defaults = {
  compressionLevel: 7,
  quantizePositionBits: 11,
  quantizeNormalBits: 8,
  quantizeTexcoordBits: 10,
  quantizeColorBits: 8,
  quantizeSkinBits: 8,
  quantizeGenericBits: 8,
  uncompressedFallback: false,
  unifiedQuantization: false,
};
