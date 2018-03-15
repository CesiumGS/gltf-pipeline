'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var addExtensionsRequired = require('./addExtensionsRequired');
var addExtensionsUsed = require('./addExtensionsUsed');
var addToArray = require('./addToArray');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var draco3d = require('draco3d');
var getAccessorByteStride = require('./getAccessorByteStride');
var getComponentReader = require('./getComponentReader.js');
var hashObject = require('object-hash');
var numberOfComponentsForType = require('./numberOfComponentsForType');

var defined = Cesium.defined;
var ComponentDatatype = Cesium.ComponentDatatype;
var arrayFill = Cesium.arrayFill;

// Prepare encoder for compressing meshes.
var encoderModule = draco3d.createEncoderModule({});

module.exports = compressMeshes;

function readAccessorPacked(gltf, accessor) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var source = gltf.buffers[bufferView.buffer].extras._pipeline.source;
    var numberOfComponents = numberOfComponentsForType(accessor.type);
    var count = accessor.count;
    var componentTypeByteLength = byteLengthForComponentType(accessor.componentType);
    var byteOffset = accessor.byteOffset + bufferView.byteOffset + source.byteOffset;
    var byteStride = getAccessorByteStride(gltf, accessor);

    var dataView = new DataView(source.buffer);
    var components = new Array(numberOfComponents);
    var componentReader = getComponentReader(accessor.componentType);

    var values = [];
    for (var i = 0; i < count; ++i) {
        componentReader(dataView, byteOffset, numberOfComponents, componentTypeByteLength, components);

        for (var j = 0; j < numberOfComponents; ++j) {
            values.push(components[j]);
        }

        byteOffset += byteStride;
    }
    return values;
}

/**
 * Contains functions for removing elements from a glTF hierarchy.
 * Since top-level glTF elements are arrays, when something is removed, referring
 * indices need to be updated.
 * @constructor
 */
function Remove() {}

Remove.accessor = function(gltf, accessorId) {
    var accessors = gltf.accessors;

    accessors.splice(accessorId, 1);

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(attributeAccessorId, semantic) {
                if (attributeAccessorId > accessorId) {
                    primitive.attributes[semantic]--;
                }
            });
            var indices = primitive.indices;
            if (defined(indices) && indices > accessorId) {
                primitive.indices--;
            }
        });
    });

    ForEach.skin(gltf, function(skin) {
        if (defined(skin.inverseBindMatrices) && skin.inverseBindMatrices > accessorId) {
            skin.inverseBindMatrices--;
        }
    });

    ForEach.animation(gltf, function(animation) {
        ForEach.animationSampler(animation, function(sampler) {
            if (defined(sampler.input) && sampler.input > accessorId) {
                sampler.input--;
            }
            if (defined(sampler.output) && sampler.output > accessorId) {
                sampler.output--;
            }
        });
    });

    if (defined(gltf.extensionsUsed) &&
        gltf.extensionsUsed.indexOf('Draco_animation_compression') >= 0) {
        gltf.extensions.Draco_animation_compression.forEach(function (compressedAnimation) {
            if (compressedAnimation.input > accessorId) {
                compressedAnimation.input--;
            }
            for (var i = 0; i < compressedAnimation.outputs.length; ++i) {
                if (compressedAnimation.outputs[i] > accessorId)
                    compressedAnimation.outputs[i]--;
            }
        });
    }
};

Remove.buffer = function(gltf, bufferId) {
    var buffers = gltf.buffers;

    buffers.splice(bufferId, 1);

    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(bufferView.buffer) && bufferView.buffer > bufferId) {
            bufferView.buffer--;
        }
    });
};

Remove.bufferView = function(gltf, bufferViewId) {
    var bufferViews = gltf.bufferViews;

    bufferViews.splice(bufferViewId, 1);

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView) && accessor.bufferView > bufferViewId) {
            accessor.bufferView--;
        }
    });

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive, primitiveId) {
            if (defined(primitive.extensions) &&
                defined(primitive.extensions.KHR_draco_mesh_compression)) {
                if (primitive.extensions.KHR_draco_mesh_compression.bufferView > bufferViewId) {
                    primitive.extensions.KHR_draco_mesh_compression.bufferView--;
                }
            }
        });
    });

    if (defined(gltf.extensionsUsed) &&
        gltf.extensionsUsed.indexOf('Draco_animation_compression') >= 0) {
        gltf.extensions.Draco_animation_compression.forEach(function (compressedAnimation) {
            compressedAnimation.bufferView--;
        });
    }
};

function TypeToName() {}

TypeToName.accessor = function() {
    return 'accessors';
};

TypeToName.buffer = function() {
    return 'buffers';
};

TypeToName.bufferView = function() {
    return 'bufferViews';
};

function removeUnusedElements(gltf, type, usedIds) {
    var removed = 0;
    var name = TypeToName[type]();
    var arrayOfObjects = gltf[name];

    if (defined(arrayOfObjects)) {
        var length = arrayOfObjects.length;
        for (var i = 0; i < length; ++i) {
            if (!usedIds[i]) {
                Remove[type](gltf, i - removed);
                removed++;
            }
        }
    }
}

/**
 * Remove all unused accessors in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused accessors.
 */
function removeAccessors(gltf) {
    // Calculate accessor's that are currently in use.
    var usedAccessorIds = {};

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId) {
                usedAccessorIds[accessorId] = true;
            });
            var indices = primitive.indices;
            if (defined(indices)) {
                usedAccessorIds[indices] = true;
            }
        });
    });

    ForEach.skin(gltf, function(skin) {
       if (defined(skin.inverseBindMatrices)) {
           usedAccessorIds[skin.inverseBindMatrices] = true;
       }
    });

    ForEach.animation(gltf, function(animation) {
        ForEach.animationSampler(animation, function(sampler) {
            if (defined(sampler.input)) {
                usedAccessorIds[sampler.input] = true;
            }
            if (defined(sampler.output)) {
                usedAccessorIds[sampler.output] = true;
            }
        });
    });

    removeUnusedElements(gltf, 'accessor', usedAccessorIds);
    return gltf;
};

/**
 * Remove all unused buffer views in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers views.
 */
function removeBufferViews(gltf) {
    // Calculate bufferView's that are currently in use.
    var usedBufferViewIds = {};

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            usedBufferViewIds[accessor.bufferView] = true;
        }
    });

    if (defined(gltf.extensionsUsed) &&
        gltf.extensionsUsed.indexOf('KHR_draco_mesh_compression') >= 0) {
        ForEach.mesh(gltf, function(mesh) {
            ForEach.meshPrimitive(mesh, function(primitive, primitiveId) {
                if (defined(primitive.extensions) &&
                    defined(primitive.extensions.KHR_draco_mesh_compression)) {
                    usedBufferViewIds[primitive.extensions.KHR_draco_mesh_compression.bufferView] = true;
                }
            });
        });
    }

    if (defined(gltf.extensionsUsed) &&
        gltf.extensionsUsed.indexOf('Draco_animation_compression') >= 0) {
        gltf.extensions.Draco_animation_compression.forEach(function (compressedAnimation) {
            usedBufferViewIds[compressedAnimation.bufferView] = true;
        });
    }

    removeUnusedElements(gltf, 'bufferView', usedBufferViewIds);
    return gltf;
};

/**
 * Remove all unused buffers in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers.
 */
function removeBuffers(gltf) {
    // Calculate buffer's that are currently in use.
    var usedBufferIds = {};

    ForEach.bufferView(gltf, function(bufferView) {
       if (defined(bufferView.buffer)) {
           usedBufferIds[bufferView.buffer] = true;
       }
    });

    removeUnusedElements(gltf, 'buffer', usedBufferIds);
    return gltf;
};

function getNamedAttributeData(gltf, primitive, semantic) {
    var accessorId = primitive.attributes[semantic];
    var accessor = gltf.accessors[accessorId];
    var componentsPerAttribute = numberOfComponentsForType(accessor.type);
    var packed = readAccessorPacked(gltf, accessor);

    return {
        numberOfComponents : componentsPerAttribute,
        numberOfVertices : accessor.count,
        data : packed
    };
}

function addCompressionExtensionToPrimitive(gltf, primitive,
    attributeToId, encodedLen, encodedData) {
    // Remove properties from accessors.
    // Remove indices bufferView.

    var indicesAccessor = gltf.accessors[primitive.indices];
    var newIndicesAccessor = {
        componentType : indicesAccessor.componentType,
        count : indicesAccessor.count,
        max : indicesAccessor.max,
        min : indicesAccessor.min,
        type : indicesAccessor.type
    };
    var indicesAccessorId = addToArray(gltf.accessors, newIndicesAccessor);
    primitive.indices = indicesAccessorId;

    // Remove attributes bufferViews.
    for (var semantic in primitive.attributes) {
        var attributeAccessor = gltf.accessors[primitive.attributes[semantic]];
        var newAttributeAccessor = {
            componentType : attributeAccessor.componentType,
            count : attributeAccessor.count,
            max : attributeAccessor.max,
            min : attributeAccessor.min,
            type : attributeAccessor.type
        };
        var attributeAccessorId = addToArray(gltf.accessors, newAttributeAccessor);
        primitive.attributes[semantic] = attributeAccessorId;
    }

    var buffer = {
        byteLength : encodedLen,
        extras : {
            _pipeline : {
                extension : '.bin',
                source :encodedData
            }
        }
    };
    var bufferId = addToArray(gltf.buffers, buffer);
    var bufferView = {
        buffer : bufferId,
        byteOffset : 0,
        byteLength : encodedLen
    };
    var bufferViewId = addToArray(gltf.bufferViews, bufferView);

    var extensions = primitive.extensions;
    if (!defined(primitive.extensions)) {
        extensions = {};
        primitive.extensions = extensions;
    }
    var draco_extension = {
        bufferView : bufferViewId,
        attributes : attributeToId,
    };
    extensions.KHR_draco_mesh_compression = draco_extension;
}

function copyCompressedExtensionToPrimitive(primitive, compressedPrimitive) {
    var attributes = {};
    for (var semantic in primitive.attributes) {
        attributes[semantic] = compressedPrimitive.attributes[semantic];
    }
    primitive.attributes = attributes;
    primitive.indices = compressedPrimitive.indices;

    var draco_extension = compressedPrimitive.extensions.KHR_draco_mesh_compression
    var extensions = {};
    primitive.extensions = extensions;
    var copied_extension = {
        bufferView : draco_extension.bufferView,
        attributes : draco_extension.attributes,
    };
    extensions.KHR_draco_mesh_compression = copied_extension;
}

function compressMeshes(gltf, options) {
    addExtensionsRequired(gltf, 'KHR_draco_mesh_compression');
    var hashPrimitives = [];
    options = options === undefined ? {} : options;
    var compressionLevel = !defined(options.compressionLevel) ? 7 : options.compressionLevel;
    var positionQuantization = !defined(options.quantizePosition) ? 14 : options.quantizePosition;
    var normalQuantization = options.quantizeNormal === undefined ? 10 : options.quantizeNormal;
    var texcoordQuantization = options.quantizeTexcoord === undefined ? 12 : options.quantizeTexcoord;
    var colorQuantization = options.quantizeColor === undefined ? 8 : options.quantizeColor;
    var skinQuantization = options.quantizeSkin === undefined ? 12 : options.quantizeSkin;
    var useUnifiedQuantization = options.unifiedQuantization === undefined ? false : options.unifiedQuantization;
    var positionOrigin, positionRange;

    if (useUnifiedQuantization) {
        // Collect bounding box from all primitives. Currently works only for vec3 positions (XYZ).
        var accessors = gltf.accessors;
        var min = arrayFill(new Array(3), Number.POSITIVE_INFINITY);
        var max = arrayFill(new Array(3), Number.NEGATIVE_INFINITY);
        ForEach.accessorWithSemantic(gltf, "POSITION", function(accessorId, attributeSemantic, primitive) {
            var accessor = accessors[accessorId];
            if (accessor.type !== 'VEC3') {
                console.log("Couldn't perform unified quantization. Input contains position accessor with an unsupported number of components.");
                useUnifiedQuantization = false;
                return;
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
        ForEach.meshPrimitive(mesh, function(primitive, primitiveId) {
            var primitiveType = primitive.mode;
            // Only support triangles now.
            if (defined(primitive.mode) && primitive.mode !== 4) {
                console.log("Skipped primitive. Unsupported primitive mode.");
                return;
            }

            // TODO: Use hash map.
            var primitiveGeometry = {
                attributes : primitive.attributes,
                indices : primitive.indices,
                mode : primitive.mode
            };
            var hashValue = hashObject(primitiveGeometry);
            if (hashPrimitives[hashValue] !== undefined) {
                console.log('Found duplicate!');
                // Copy compressed primitive.
                copyCompressedExtensionToPrimitive(primitive, hashPrimitives[hashValue]);
                return;
            } else {
                hashPrimitives[hashValue] = primitive;
            }

            const encoder = new encoderModule.Encoder();
            const meshBuilder = new encoderModule.MeshBuilder();
            const newMesh = new encoderModule.Mesh();

            // First get the faces and add to geometry.
            var indicesData = readAccessorPacked(gltf, gltf.accessors[primitive.indices]);

            const indices = new Uint32Array(indicesData);
            const numberOfFaces = indices.length / 3;
            const numberOfIndices = indices.length;

            console.log("Num of faces: " + numberOfFaces);
            meshBuilder.AddFacesToMesh(newMesh, numberOfFaces, indices);

            // Add attributes to mesh.
            var attributes = primitive.attributes;
            var attributeToId = {};
            for (var semantic in attributes) {
                const attributeData = getNamedAttributeData(gltf, primitive, semantic);
                const numberOfPoints = attributeData.numberOfVertices;
                var attributeName = semantic;
                if (semantic.indexOf('_') !== -1)
                    attributeName = attributeName.substring(0, semantic.indexOf('_'));

                const data = new Float32Array(attributeData.data);
                var attributeId = -1;
                if (attributeName === 'POSITION' || attributeName === 'NORMAL' ||
                    attributeName === 'COLOR' ) {
                    attributeId = meshBuilder.AddFloatAttributeToMesh(newMesh, encoderModule[attributeName],
                        numberOfPoints, attributeData.numberOfComponents, data);
                } else if (semantic === 'TEXCOORD_0') {
                    attributeId = meshBuilder.AddFloatAttributeToMesh(newMesh, encoderModule.TEX_COORD,
                        numberOfPoints, attributeData.numberOfComponents, data);
                } else {
                    attributeId = meshBuilder.AddFloatAttributeToMesh(newMesh, encoderModule.GENERIC,
                        numberOfPoints, attributeData.numberOfComponents, data);
                }

                if (attributeId === -1) {
                    console.log("Error: Failed adding attribute " + semantic);
                    return;
                } else {
                    attributeToId[semantic] = attributeId;
                }
            }

            let encodedDracoDataArray = new encoderModule.DracoInt8Array();
            encoder.SetSpeedOptions(10 - compressionLevel, 10 - compressionLevel);  // Compression level is 10 - speed.
            if (useUnifiedQuantization) {
                encoder.SetAttributeExplicitQuantization(encoderModule.POSITION, positionQuantization, 3, positionOrigin, positionRange);
            } else {
                encoder.SetAttributeQuantization(encoderModule.POSITION, positionQuantization);
            }
            encoder.SetAttributeQuantization(encoderModule.NORMAL, normalQuantization);
            encoder.SetAttributeQuantization(encoderModule.TEX_COORD, texcoordQuantization);
            encoder.SetAttributeQuantization(encoderModule.COLOR, colorQuantization);
            encoder.SetAttributeQuantization(encoderModule.GENERIC, skinQuantization);

            const encodedLength = encoder.EncodeMeshToDracoBuffer(newMesh, encodedDracoDataArray);
            if (encodedLength > 0) {
                console.log("Encoded size is " + encodedLength);
            } else {
                console.log("Error: Encoding failed.");
            }
            var encodedData = new Buffer(encodedLength);
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

    gltf = removeAccessors(gltf);
    gltf = removeBufferViews(gltf);
    gltf = removeBuffers(gltf);
    return gltf;
}
