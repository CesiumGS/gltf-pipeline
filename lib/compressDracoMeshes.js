'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');
var hashObject = require('object-hash');
var addBuffer = require('./addBuffer');
var addExtensionsRequired = require('./addExtensionsRequired');
var addExtensionsUsed = require('./addExtensionsUsed');
var addToArray = require('./addToArray');
var ForEach = require('./ForEach');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readAccessorPacked = require('./readAccessorPacked');
var removeUnusedElements = require('./removeUnusedElements');
var replaceWithDecompressedPrimitive = require('./replaceWithDecompressedPrimitive');
var splitPrimitives = require('./splitPrimitives');

var arrayFill = Cesium.arrayFill;
var Check = Cesium.Check;
var clone = Cesium.clone;
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var RuntimeError = Cesium.RuntimeError;
var WebGLConstants = Cesium.WebGLConstants;

// Prepare encoder for compressing meshes.
var encoderModule = draco3d.createEncoderModule({});

module.exports = compressDracoMeshes;

/**
 * Compresses meshes using Draco compression in the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options The same options object as {@link processGltf}
 * @param {Object} options.dracoOptions Options defining Draco compression settings.
 * @param {Number} [options.dracoOptions.compressionLevel=7] A value between 0 and 10 specifying the quality of the Draco compression. Higher values produce better quality compression but may take longer to decompress. A value of 0 will apply sequential encoding and preserve face order.
 * @param {Number} [options.dracoOptions.quantizePositionBits=14] A value between 0 and 30 specifying the number of bits used for positions. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeNormalBits=10] A value between 0 and 30 specifying the number of bits used for normals. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeTexcoordBits=12] A value between 0 and 30 specifying the number of bits used for texture coordinates. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeColorBits=8] A value between 0 and 30 specifying the number of bits used for color attributes. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeGenericBits=12] A value between 0 and 30 specifying the number of bits used for skinning attributes (joint indices and joint weights) and custom attributes. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Boolean} [options.dracoOptions.uncompressedFallback=false] If set, add uncompressed fallback versions of the compressed meshes.
 * @param {Boolean} [options.dracoOptions.unifiedQuantization=false] Quantize positions, defined by the unified bounding box of all primitives. If not set, quantization is applied separately.
 * @returns {Object} The glTF asset with compressed meshes.
 *
 * @private
 */
function compressDracoMeshes(gltf, options) {
    options = defaultValue(options, {});
    var dracoOptions = defaultValue(options.dracoOptions, {});
    var defaults = compressDracoMeshes.defaults;
    var compressionLevel = defaultValue(dracoOptions.compressionLevel, defaults.compressionLevel);
    var quantizePositionBits = defaultValue(dracoOptions.quantizePositionBits, defaults.quantizePositionBits);
    var quantizeNormalBits = defaultValue(dracoOptions.quantizeNormalBits, defaults.quantizeNormalBits);
    var quantizeTexcoordBits = defaultValue(dracoOptions.quantizeTexcoordBits, defaults.quantizeTexcoordBits);
    var quantizeColorBits = defaultValue(dracoOptions.quantizeColorBits, defaults.quantizeColorBits);
    var quantizeGenericBits = defaultValue(dracoOptions.quantizeGenericBits, defaults.quantizeGenericBits);
    var uncompressedFallback = defaultValue(dracoOptions.uncompressedFallback, defaults.uncompressedFallback);
    var unifiedQuantization = defaultValue(dracoOptions.unifiedQuantization, defaults.unifiedQuantization);
    checkRange('compressionLevel', compressionLevel, 0, 10);
    checkRange('quantizePositionBits', quantizePositionBits, 0, 30);
    checkRange('quantizeNormalBits', quantizeNormalBits, 0, 30);
    checkRange('quantizeTexcoordBits', quantizeTexcoordBits, 0, 30);
    checkRange('quantizeColorBits', quantizeColorBits, 0, 30);
    checkRange('quantizeGenericBits', quantizeGenericBits, 0, 30);

    splitPrimitives(gltf);

    var hashPrimitives = {};
    var positionOrigin;
    var positionRange;

    if (unifiedQuantization) {
        // Collect bounding box from all primitives. Currently works only for vec3 positions (XYZ).
        var accessors = gltf.accessors;
        var min = arrayFill(new Array(3), Number.POSITIVE_INFINITY);
        var max = arrayFill(new Array(3), Number.NEGATIVE_INFINITY);
        ForEach.accessorWithSemantic(gltf, 'POSITION', function(accessorId) {
            var accessor = accessors[accessorId];
            if (accessor.type !== 'VEC3') {
                throw new RuntimeError('Could not perform unified quantization. Input contains position accessor with an unsupported number of components.');
            }
            var accessorMin = accessor.min;
            var accessorMax = accessor.max;
            for (var j = 0; j < 3; ++j) {
                min[j] = Math.min(min[j], accessorMin[j]);
                max[j] = Math.max(max[j], accessorMax[j]);
            }
        });
        positionOrigin = min;
        positionRange = Math.max(max[0] - min[0], Math.max(max[1] - min[1], max[2] - min[2]));
    }

    var addedExtension = false;

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            if (defined(primitive.mode) && primitive.mode !== WebGLConstants.TRIANGLES) {
                return;
            }
            if (!defined(primitive.indices)) {
                return;
            }

            addedExtension = true;

            var primitiveGeometry = {
                attributes: primitive.attributes,
                indices: primitive.indices,
                mode: primitive.mode
            };
            var hashValue = hashObject(primitiveGeometry);
            if (defined(hashPrimitives[hashValue])) {
                // Copy compressed primitive.
                copyCompressedExtensionToPrimitive(primitive, hashPrimitives[hashValue]);
                return;
            }
            hashPrimitives[hashValue] = primitive;

            var encoder = new encoderModule.Encoder();
            var meshBuilder = new encoderModule.MeshBuilder();
            var mesh = new encoderModule.Mesh();

            // First get the faces and add to geometry.
            var indicesData = readAccessorPacked(gltf, gltf.accessors[primitive.indices]);
            var indices = new Uint32Array(indicesData);
            var numberOfFaces = indices.length / 3;
            meshBuilder.AddFacesToMesh(mesh, numberOfFaces, indices);

            // Add attributes to mesh.
            var attributeToId = {};
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
                var accessor = gltf.accessors[accessorId];
                var componentType = accessor.componentType;
                var numberOfPoints = accessor.count;
                var numberOfComponents = numberOfComponentsForType(accessor.type);
                var packed = readAccessorPacked(gltf, accessor);
                var addAttributeFunctionName = getAddAttributeFunctionName(componentType);
                var data = ComponentDatatype.createTypedArray(componentType, packed);

                var attributeName = semantic;
                if (semantic.indexOf('_') > 0) { // Skip user-defined semantics prefixed with underscore
                    attributeName = attributeName.substring(0, semantic.indexOf('_'));
                }

                var attributeEnum;
                if (attributeName === 'POSITION' || attributeName === 'NORMAL' || attributeName === 'COLOR') {
                    attributeEnum = encoderModule[attributeName];
                } else if (attributeName === 'TEXCOORD') {
                    attributeEnum = encoderModule.TEX_COORD;
                } else {
                    attributeEnum = encoderModule.GENERIC;
                }

                var attributeId = meshBuilder[addAttributeFunctionName](mesh, attributeEnum, numberOfPoints, numberOfComponents, data);

                if (attributeId === -1) {
                    throw new RuntimeError('Error: Failed adding attribute ' + semantic);
                } else {
                    attributeToId[semantic] = attributeId;
                }
            });

            var encodedDracoDataArray = new encoderModule.DracoInt8Array();
            encoder.SetSpeedOptions(10 - compressionLevel, 10 - compressionLevel);  // Compression level is 10 - speed.
            if (quantizePositionBits > 0) {
                if (unifiedQuantization) {
                    encoder.SetAttributeExplicitQuantization(encoderModule.POSITION, quantizePositionBits, 3, positionOrigin, positionRange);
                } else {
                    encoder.SetAttributeQuantization(encoderModule.POSITION, quantizePositionBits);
                }
            }
            if (quantizeNormalBits > 0) {
                encoder.SetAttributeQuantization(encoderModule.NORMAL, quantizeNormalBits);
            }
            if (quantizeTexcoordBits > 0) {
                encoder.SetAttributeQuantization(encoderModule.TEX_COORD, quantizeTexcoordBits);
            }
            if (quantizeColorBits > 0) {
                encoder.SetAttributeQuantization(encoderModule.COLOR, quantizeColorBits);
            }
            if (quantizeGenericBits > 0) {
                encoder.SetAttributeQuantization(encoderModule.GENERIC, quantizeGenericBits);
            }

            if (defined(primitive.targets)) {
                // Set sequential encoding to preserve order of vertices.
                encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
            }

            encoder.SetTrackEncodedProperties(true);
            var encodedLength = encoder.EncodeMeshToDracoBuffer(mesh, encodedDracoDataArray);
            if (encodedLength <= 0) {
                throw new RuntimeError('Error: Draco encoding failed.');
            }

            var encodedData = Buffer.alloc(encodedLength);
            for (var i = 0; i < encodedLength; ++i) {
                encodedData[i] = encodedDracoDataArray.GetValue(i);
            }

            var dracoEncodedBuffer = {
                buffer: encodedData,
                numberOfPoints: encoder.GetNumberOfEncodedPoints(),
                numberOfFaces: encoder.GetNumberOfEncodedFaces()
            };
            addCompressionExtensionToPrimitive(gltf, primitive, attributeToId, dracoEncodedBuffer, uncompressedFallback);

            encoderModule.destroy(encodedDracoDataArray);
            encoderModule.destroy(mesh);
            encoderModule.destroy(meshBuilder);
            encoderModule.destroy(encoder);
        });
    });

    if (addedExtension) {
        if (uncompressedFallback) {
            addExtensionsUsed(gltf, 'KHR_draco_mesh_compression');
        } else {
            addExtensionsRequired(gltf, 'KHR_draco_mesh_compression');
        }
        removeUnusedElements(gltf);

        if (uncompressedFallback) {
            assignMergedBufferNames(gltf);
        }
    }

    return gltf;
}

function addCompressionExtensionToPrimitive(gltf, primitive, attributeToId, dracoEncodedBuffer, uncompressedFallback) {
    if (!uncompressedFallback) {
        // Remove properties from accessors.
        // Remove indices bufferView.
        var indicesAccessor = clone(gltf.accessors[primitive.indices]);
        delete indicesAccessor.bufferView;
        delete indicesAccessor.byteOffset;
        primitive.indices = addToArray(gltf.accessors, indicesAccessor);

        // Remove attributes bufferViews.
        ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
            var attributeAccessor = clone(gltf.accessors[accessorId]);
            delete attributeAccessor.bufferView;
            delete attributeAccessor.byteOffset;
            primitive.attributes[semantic] = addToArray(gltf.accessors, attributeAccessor);
        });
    }

    var bufferViewId = addBuffer(gltf, dracoEncodedBuffer.buffer);

    primitive.extensions = defaultValue(primitive.extensions, {});
    primitive.extensions.KHR_draco_mesh_compression = {
        bufferView: bufferViewId,
        attributes: attributeToId
    };

    gltf = replaceWithDecompressedPrimitive(gltf, primitive, dracoEncodedBuffer, uncompressedFallback);
}

function copyCompressedExtensionToPrimitive(primitive, compressedPrimitive) {
    ForEach.meshPrimitiveAttribute(compressedPrimitive, function(accessorId, semantic) {
        primitive.attributes[semantic] = accessorId;
    });
    primitive.indices = compressedPrimitive.indices;

    var dracoExtension = compressedPrimitive.extensions.KHR_draco_mesh_compression;
    primitive.extensions = defaultValue(primitive.extensions, {});
    primitive.extensions.KHR_draco_mesh_compression = {
        bufferView: dracoExtension.bufferView,
        attributes: dracoExtension.attributes
    };
}

function assignBufferViewName(gltf, bufferViewId, name) {
    var bufferView = gltf.bufferViews[bufferViewId];
    var buffer = gltf.buffers[bufferView.buffer];
    buffer.extras._pipeline.mergedBufferName = name;
}

function assignAccessorName(gltf, accessorId, name) {
    var bufferViewId = gltf.accessors[accessorId].bufferView;
    if (defined(bufferViewId)) {
        assignBufferViewName(gltf, bufferViewId, name);
    }
}

function assignMergedBufferNames(gltf) {
    ForEach.accessorContainingVertexAttributeData(gltf, function(accessorId) {
        assignAccessorName(gltf, accessorId, 'uncompressed');
    });
    ForEach.accessorContainingIndexData(gltf, function(accessorId) {
        assignAccessorName(gltf, accessorId, 'uncompressed');
    });
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            if (defined(primitive.extensions) &&
                defined(primitive.extensions.KHR_draco_mesh_compression)) {
                assignBufferViewName(gltf, primitive.extensions.KHR_draco_mesh_compression.bufferView, 'draco');
            }
        });
    });
}

function getAddAttributeFunctionName(componentType) {
    switch (componentType) {
        case WebGLConstants.UNSIGNED_BYTE:
            return 'AddUInt8Attribute';
        case WebGLConstants.BYTE:
            return 'AddInt8Attribute';
        case WebGLConstants.UNSIGNED_SHORT:
            return 'AddUInt16Attribute';
        case WebGLConstants.SHORT:
            return 'AddInt16Attribute';
        case WebGLConstants.UNSIGNED_INT:
            return 'AddUInt32Attribute';
        case WebGLConstants.INT:
            return 'AddInt32Attribute';
        case WebGLConstants.FLOAT:
            return 'AddFloatAttribute';
    }
}

function checkRange(name, value, minimum, maximum) {
    Check.typeOf.number.greaterThanOrEquals(name, value, minimum);
    Check.typeOf.number.lessThanOrEquals(name, value, maximum);
}

compressDracoMeshes.defaults = {
    compressionLevel: 7,
    quantizePositionBits: 14,
    quantizeNormalBits: 10,
    quantizeTexcoordBits: 12,
    quantizeColorBits: 8,
    quantizeSkinBits: 12,
    quantizeGenericBits: 12,
    uncompressedFallback: false,
    unifiedQuantization: false
};
