'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var jp = require('jsonpath');
var _ = require('underscore');

var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');

var Cartesian3 = Cesium.Cartesian3;
var GeometryPipeline = Cesium.GeometryPipeline;
var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var findAccessorMinMax = require('./findAccessorMinMax');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var getUniqueId = require('./getUniqueId');
var mergeBuffers = require('./mergeBuffers');
var mergeDuplicateVertices = require('./mergeDuplicateVertices');
var modelMaterialsCommon = require('./modelMaterialsCommon');
var readAccessor = require('./readAccessor');
var writeAccessor = require('./writeAccessor');

module.exports = generateNormals;

/**
 * Generates normals for primitives if they do not exist.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with generated normals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function generateNormals(gltf, options) {
    var faceNormals = defaultValue(options.faceNormals, false);
    var primitives = getPrimitives(gltf);
    var primitivesLength = primitives.length;
    var generatedMaterials = {};
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var positionAccessorId = primitive.attributes.POSITION;
        var normalAccessorId = primitive.attributes.NORMAL;
        var indicesAccessorId = primitive.indices;

        if (primitive.mode === WebGLConstants.TRIANGLES && defined(indicesAccessorId) && defined(positionAccessorId) && !defined(normalAccessorId)) {
            if (faceNormals) {
                generateFaceNormals(gltf, primitive);
            } else {
                var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                GeometryPipeline.computeNormal(geometry);
                cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
            generateMaterial(gltf, options, primitive, generatedMaterials);
        }
    }
    modelMaterialsCommon(gltf, options);
    mergeBuffers(gltf, 'buffer_0');
}

var scratchNormalOne = new Cartesian3();
var scratchNormalTwo = new Cartesian3();
function generateFaceNormals(gltf, primitive) {
    var accessors = gltf.accessors;
    var attributes = primitive.attributes;
    // TODO: match against attribute semantics
    var positionSemantic = "POSITION";
    var positionAccessorId = attributes[positionSemantic];
    var positionAccessor = accessors[positionAccessorId];
    var positions = [];
    readAccessor(gltf, positionAccessor, positions);
    var indices;
    var indicesAccessorId = primitive.indices;
    var indicesAccessor;
    if (!defined(indicesAccessorId)) {
        indices = _.range(positions.length);
    } else {
        indicesAccessor = accessors[indicesAccessorId];
        indices = [];
        readAccessor(gltf, indicesAccessor, indices);
    }
    var generatedPositions = [];
    var generatedNormals = [];
    var indicesLength = indices.length;
    for (var i = 0; i < indicesLength; i+=3) {
        var positionOne = positions[indices[i]];
        var positionTwo = positions[indices[i+1]];
        var positionThree = positions[indices[i+2]];
        Cartesian3.subtract(positionTwo, positionOne, scratchNormalOne);
        Cartesian3.subtract(positionThree, positionOne, scratchNormalTwo);
        var normal = new Cartesian3();
        Cartesian3.cross(scratchNormalOne, scratchNormalTwo, normal);
        generatedPositions.push(positionOne);
        generatedPositions.push(positionTwo);
        generatedPositions.push(positionThree);
        generatedNormals.push(normal);
        generatedNormals.push(normal);
        generatedNormals.push(normal);
    }
    attributes.POSITION = generateVec3FloatAccessor(gltf, generatedPositions);
    attributes.NORMAL = generateVec3FloatAccessor(gltf, generatedNormals);
    if (defined(indicesAccessorId)) {
        writeAccessor(gltf, indicesAccessor, _.range(generatedPositions.length));
        mergeDuplicateVertices(gltf);
    }
}

function generateVec3FloatAccessor(gltf, data) {
    var accessorId = getUniqueId(gltf, 'accessor');
    var bufferViewId = getUniqueId(gltf, 'bufferView');
    var bufferId = getUniqueId(gltf, 'buffer');
    var packedArray = [];
    Cartesian3.packArray(data, packedArray);
    var bufferData = new Buffer(new Float32Array(packedArray).buffer);

    var accessor = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.FLOAT,
        count : data.length,
        extras : {
            _pipeline : {
                deleteExtras : true
            }
        },
        type : "VEC3"
    };
    gltf.accessors[accessorId] = accessor;

    var bufferView = {
        buffer : bufferId,
        byteLength : bufferData.length,
        byteOffset : 0,
        extras : {
            _pipeline : {
                deleteExtras : true
            }
        },
        target : WebGLConstants.ARRAY_BUFFER
    };
    gltf.bufferViews[bufferViewId] = bufferView;

    var buffer = {
        type : "arraybuffer",
        byteLength : bufferData.length,
        extras : {
            _pipeline : {
                deleteExtras : true,
                extension : '.bin',
                source : bufferData
            }
        }
    };
    gltf.buffers[bufferId] = buffer;
    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;

    return accessorId;
}

function generateMaterial(gltf, options, primitive, generatedMaterials) {
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    var materialId = primitive.material;

    var generatedMaterialId = generatedMaterials[materialId];
    if (defined(generatedMaterialId)) {
        primitive.material = generatedMaterialId;
        return;
    }

    var material = materials[materialId];
    var techniqueId = material.technique;
    var technique = techniques[techniqueId];

    var normalParameter = jp.query(technique, '$.parameters[?(@.semantic == \"NORMAL\")]');
    if (!defined(normalParameter) || normalParameter.length === 0) {
        addExtensionsUsed(gltf, 'KHR_materials_common');
        generatedMaterialId = getUniqueId(gltf, materialId + '-common');
        var values = clone(material.values);
        values.doubleSided = true;
        materials[generatedMaterialId] = {
            extensions : {
                KHR_materials_common : {
                    technique : "BLINN",
                    values : values
                }
            }
        };
        primitive.material = generatedMaterialId;
        generatedMaterials[materialId] = generatedMaterialId;
    }
    return gltf;
}

function getPrimitives(gltf) {
    var primitives = [];
    var nodes = gltf.nodes;
    var meshes = gltf.meshes;
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                var node = nodes[nodeId];
                var nodeMeshes = node.meshes;
                if (defined(nodeMeshes) && nodeMeshes.length > 0) {
                    for (var i = 0; i < nodeMeshes.length; i++) {
                        var meshPrimitives = meshes[nodeMeshes[i]].primitives;
                        if (defined(meshPrimitives)) {
                            for (var j = 0; j < meshPrimitives.length; j++) {
                                primitives.push(meshPrimitives[j]);
                            }
                        }
                    }
                }
            }
        }
    }
    return primitives;
}
