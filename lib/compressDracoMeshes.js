'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');
var hashObject = require('object-hash');
var ForEach = require('./ForEach');
var addExtensionsRequired = require('./addExtensionsRequired');
var addToArray = require('./addToArray');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readAccessorPacked = require('./readAccessorPacked');
var removeUnusedElements = require('./removeUnusedElements');
var splitPrimitives = require('./splitPrimitives');

var checkGreaterThanOrEquals = Cesium.Check.typeOf.number.greaterThanOrEquals;
var checkLessThan = Cesium.Check.typeOf.number.lessThan;
var clone = Cesium.clone;
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var RuntimeError = Cesium.RuntimeError;
var arrayFill = Cesium.arrayFill;
var WebGLConstants = Cesium.WebGLConstants;

// Prepare encoder for compressing meshes.
var encoderModule = draco3d.createEncoderModule({});

module.exports = compressDracoMeshes;

function addCompressionExtensionToPrimitive(gltf, primitive, attributeToId, encodedLength, encodedData) {
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

    var buffer = {
        byteLength: encodedLength,
        extras: {
            _pipeline: {
                source: encodedData
            }
        }
    };
    var bufferId = addToArray(gltf.buffers, buffer);
    var bufferView = {
        buffer: bufferId,
        byteOffset: 0,
        byteLength: encodedLength
    };
    var bufferViewId = addToArray(gltf.bufferViews, bufferView);

    var extensions = primitive.extensions;
    if (!defined(primitive.extensions)) {
        extensions = {};
        primitive.extensions = extensions;
    }
    extensions.KHR_draco_mesh_compression = {
        bufferView: bufferViewId,
        attributes: attributeToId
    };
}

function copyCompressedExtensionToPrimitive(primitive, compressedPrimitive) {
    var attributes = {};
    /*eslint-disable no-unused-vars*/
    ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
        attributes[semantic] = compressedPrimitive.attributes[semantic];
    });
    primitive.attributes = attributes;
    primitive.indices = compressedPrimitive.indices;

    var dracoExtension = compressedPrimitive.extensions.KHR_draco_mesh_compression;
    var extensions = {};
    primitive.extensions = extensions;
    extensions.KHR_draco_mesh_compression = {
        bufferView: dracoExtension.bufferView,
        attributes: dracoExtension.attributes
    };
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

/**
 * Compresses meshes using Draco compression in the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options The same options object as {@link processGltf}
 * @param {Object} options.dracoOptions Options defining Draco compression settings.
 * @param {Number} [options.dracoOptions.compressionLevel=7] A value between 0 and 10 specifying the quality of the Draco compression. Higher values produce better quality compression but may take longer to decompress.
 * @param {Number} [options.dracoOptions.quantizePositionBits=14] A value between 0 and 30 specifying the number of bits used for positions. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeNormalBits=10] A value between 0 and 30 specifying the number of bits used for normals. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeTexcoordBits=12] A value between 0 and 30 specifying the number of bits used for texture coordinates. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeColorBits=8] A value between 0 and 30 specifying the number of bits used for color attributes. Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeSkinBits=12] A value between 0 and 30 specifying the number of bits used for skinning attributes (joint indices and joint weights). Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Number} [options.dracoOptions.quantizeGenericBits=12] A value between 0 and 30 specifying the number of bits used for custom attributes (joint indices and joint weights). Lower values produce better compression, but will lose precision. A value of 0 does not set quantization.
 * @param {Boolean} [options.dracoOptions.unifiedQuantization=false] Quantize positions, defined by the unified bounding box of all primitives. If not set, quantization is applied separately.
 * @returns {Object} The glTF asset with compressed meshes.
 *
 * @private
 */
function compressDracoMeshes(gltf, options) {
    splitPrimitives(gltf);
    addExtensionsRequired(gltf, 'KHR_draco_mesh_compression');
    var hashPrimitives = {};
    options = defaultValue(options, {});
    options.dracoOptions = defaultValue(options.dracoOptions, {});
    var compressionLevel = defaultValue(options.dracoOptions.compressionLevel, 7);
    var positionQuantization = defaultValue(options.dracoOptions.quantizePositionBits, 14);
    var normalQuantization = defaultValue(options.dracoOptions.quantizeNormalBits, 10);
    var texcoordQuantization = defaultValue(options.dracoOptions.quantizeTexcoordBits, 12);
    var colorQuantization = defaultValue(options.dracoOptions.quantizeColorBits, 8);
    var skinQuantization = defaultValue(options.dracoOptions.quantizeSkinBits, 12);
    var useUnifiedQuantization = defaultValue(options.dracoOptions.unifiedQuantization, false);

    checkGreaterThanOrEquals('draco.compressionLevel', compressionLevel, 0);
    checkLessThan('draco.compressionLevel', compressionLevel, 11);
    checkGreaterThanOrEquals('draco.quantizePositionBits', positionQuantization, 0);
    checkLessThan('draco.quantizePositionBits', positionQuantization, 31);
    checkGreaterThanOrEquals('draco.quantizeNormalBits', normalQuantization, 0);
    checkLessThan('draco.quantizeNormalBits', normalQuantization, 31);
    checkGreaterThanOrEquals('draco.quantizeTexcoordBits', texcoordQuantization, 0);
    checkLessThan('draco.quantizeTexcoordBits', texcoordQuantization, 31);
    checkGreaterThanOrEquals('draco.quantizeColorBits', colorQuantization, 0);
    checkLessThan('draco.quantizeColorBits', colorQuantization, 31);
    checkGreaterThanOrEquals('draco.quantizeSkinBits', skinQuantization, 0);
    checkLessThan('draco.quantizeSkinBits', skinQuantization, 31);

    var positionOrigin, positionRange;

    if (useUnifiedQuantization) {
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

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            // Only support triangles now.
            if (defined(primitive.mode) && primitive.mode !== 4) {
                // Skipping primitive. Unsupported primitive mode.
                return;
            }

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
            var newMesh = new encoderModule.Mesh();

            // First get the faces and add to geometry.
            var indicesData = readAccessorPacked(gltf, gltf.accessors[primitive.indices]);

            // TODO : what if indices doesn't exist?
            var indices = new Uint32Array(indicesData);
            var numberOfFaces = indices.length / 3;
            meshBuilder.AddFacesToMesh(newMesh, numberOfFaces, indices);

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

                var attributeId = meshBuilder[addAttributeFunctionName](newMesh, attributeEnum, numberOfPoints, numberOfComponents, data);

                if (attributeId === -1) {
                    throw new RuntimeError('Error: Failed adding attribute ' + semantic);
                } else {
                    attributeToId[semantic] = attributeId;
                }
            });

            var encodedDracoDataArray = new encoderModule.DracoInt8Array();
            encoder.SetSpeedOptions(10 - compressionLevel, 10 - compressionLevel);  // Compression level is 10 - speed.
            if (positionQuantization > 0) {
                if (useUnifiedQuantization) {
                    encoder.SetAttributeExplicitQuantization(encoderModule.POSITION, positionQuantization, 3, positionOrigin, positionRange);
                } else {
                    encoder.SetAttributeQuantization(encoderModule.POSITION, positionQuantization);
                }
            }
            if (normalQuantization > 0) {
                encoder.SetAttributeQuantization(encoderModule.NORMAL, normalQuantization);
            }
            if (texcoordQuantization > 0) {
                encoder.SetAttributeQuantization(encoderModule.TEX_COORD, texcoordQuantization);
            }
            if (colorQuantization > 0) {
                encoder.SetAttributeQuantization(encoderModule.COLOR, colorQuantization);
            }
            if (skinQuantization > 0) {
                encoder.SetAttributeQuantization(encoderModule.GENERIC, skinQuantization);
            }

            if (defined(primitive.targets)) {
                // Set sequential encoding to preserve order of vertices.
                encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
            }

            var encodedLength = encoder.EncodeMeshToDracoBuffer(newMesh, encodedDracoDataArray);
            if (encodedLength <= 0) {
                throw new RuntimeError('Error: Encoding failed.');
            }
            var encodedData = Buffer.alloc(encodedLength);
            for (var i = 0; i < encodedLength; ++i) {
                encodedData[i] = encodedDracoDataArray.GetValue(i);
            }

            addCompressionExtensionToPrimitive(gltf, primitive, attributeToId, encodedLength, encodedData);

            encoderModule.destroy(encodedDracoDataArray);
            encoderModule.destroy(newMesh);
            encoderModule.destroy(meshBuilder);
            encoderModule.destroy(encoder);
        });
    });

    gltf = removeUnusedElements(gltf);
    return gltf;
}

compressDracoMeshes.defaults = {
    compressionLevel: 7,
    quantizationPosition: 14,
    quantizationNormal: 10,
    quantizationTexcoord: 12,
    quantizationColor: 8,
    quantizationSkin: 12,
    quantizationGeneric: 12,
    unifiedQuantization: false
};