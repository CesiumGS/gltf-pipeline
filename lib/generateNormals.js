'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var Cartesian3 = Cesium.Cartesian3;
var GeometryPipeline = Cesium.GeometryPipeline;
var WebGLConstants = Cesium.WebGLConstants;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var RemoveUnusedProperties = require('./RemoveUnusedProperties');
var addExtensionsUsed = require('./addExtensionsUsed');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var createAccessor = require('./createAccessor');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var getPrimitiveAttributeSemantics = require('./getPrimitiveAttributeSemantics');
var getUniqueId = require('./getUniqueId');
var mergeBuffers = require('./mergeBuffers');
var processModelMaterialsCommon = require('./processModelMaterialsCommon');
var packArray = require('./packArray');
var readAccessor = require('./readAccessor');
var techniqueParameterForSemantic = require('./techniqueParameterForSemantic');
var writeAccessor = require('./writeAccessor');
var PrimitiveHelpers = require('./PrimitiveHelpers');

var removeAccessors = RemoveUnusedProperties.removeAccessors;
var removeBufferViews = RemoveUnusedProperties.removeBufferViews;
var removeBuffers = RemoveUnusedProperties.removeBuffers;
var getAllPrimitives = PrimitiveHelpers.getAllPrimitives;

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
    options = defaultValue(options, {});
    var faceNormals = defaultValue(options.faceNormals, false);
    var primitives = getAllPrimitives(gltf);
    var primitivesLength = primitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        var positionSemantics = getPrimitiveAttributeSemantics(primitive, 'POSITION');
        var normalSemantics = getPrimitiveAttributeSemantics(primitive, 'NORMAL');
        var generatedMaterials = {};
        if (primitive.mode === WebGLConstants.TRIANGLES && positionSemantics.length > 0 && normalSemantics.length === 0) {
            if (faceNormals) {
                generateFaceNormals(gltf, primitive, positionSemantics[0]);
            } else {
                var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                GeometryPipeline.computeNormal(geometry);
                cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
            generateMaterial(gltf, primitive, generatedMaterials);
        }
    }

    removeAccessors(gltf);
    removeBufferViews(gltf);
    removeBuffers(gltf);
    mergeBuffers(gltf);
    processModelMaterialsCommon(gltf, options);
    return gltf;
}

var scratchNormalOne = new Cartesian3();
var scratchNormalTwo = new Cartesian3();
function generateFaceNormals(gltf, primitive, positionSemantic) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var attributes = primitive.attributes;
    var generateAttributes = {};
    var semantic;
    var generated;
    for (var attributeSemantic in attributes) {
        if (attributes.hasOwnProperty(attributeSemantic)) {
            var attributeAccessorId = attributes[attributeSemantic];
            var attributeAccessor = accessors[attributeAccessorId];
            var originalData = [];
            readAccessor(gltf, attributeAccessor, originalData);
            generateAttributes[attributeSemantic] = {
                generated : [],
                original : originalData
            };
        }
    }

    var indices = [];
    var indicesAccessorId = primitive.indices;
    var indicesAccessor;
    if (!defined(indicesAccessorId)) {
        var positionsLength = generateAttributes[positionSemantic].original;
        for (var i = 0; i < positionsLength; i++) {
            indices.push(i);
        }
    } else {
        indicesAccessor = accessors[indicesAccessorId];
        readAccessor(gltf, indicesAccessor, indices);
    }

    var generatedNormals = [];
    var indicesLength = indices.length;
    for (var j = 0; j < indicesLength; j+=3) {
        for (semantic in generateAttributes) {
            if (generateAttributes.hasOwnProperty(semantic)) {
                var attributeData = generateAttributes[semantic];
                var original = attributeData.original;
                generated = attributeData.generated;
                var dataOne = original[indices[j]];
                var dataTwo = original[indices[j+1]];
                var dataThree = original[indices[j+2]];
                generated.push(dataOne);
                generated.push(dataTwo);
                generated.push(dataThree);
                if (semantic === positionSemantic) {
                    var positionOne = dataOne;
                    var positionTwo = dataTwo;
                    var positionThree = dataThree;
                    Cartesian3.subtract(positionTwo, positionOne, scratchNormalOne);
                    Cartesian3.subtract(positionThree, positionOne, scratchNormalTwo);
                    var normal = new Cartesian3();

                    // Check for degenerate triangles
                    if (scratchNormalOne.equals(Cartesian3.ZERO) || scratchNormalTwo.equals(Cartesian3.ZERO)) {
                        Cartesian3.clone(Cartesian3.UNIT_X, normal);
                    } else {
                        Cartesian3.normalize(scratchNormalOne, scratchNormalOne);
                        Cartesian3.normalize(scratchNormalTwo, scratchNormalTwo);

                        // Make sure normals aren't parallel
                        var dot = Math.abs(Cartesian3.dot(scratchNormalOne, scratchNormalTwo));
                        if (CesiumMath.equalsEpsilon(dot, 1.0, CesiumMath.EPSILON15)) {
                            Cartesian3.clone(Cartesian3.UNIT_X, normal);
                        } else {
                            Cartesian3.cross(scratchNormalOne, scratchNormalTwo, normal);
                            Cartesian3.normalize(normal, normal);
                        }
                    }
                    generatedNormals.push(normal);
                    generatedNormals.push(normal);
                    generatedNormals.push(normal);
                }
            }
        }
    }

    for (semantic in generateAttributes) {
        if (generateAttributes.hasOwnProperty(semantic)) {
            generated = generateAttributes[semantic].generated;
            var accessorId = attributes[semantic];
            var accessor = accessors[accessorId];
            var bufferViewId = accessor.bufferView;
            var bufferView = bufferViews[bufferViewId];
            var newAccessorId = createAccessor(gltf, packArray(generated, accessor.type), accessor.type, accessor.componentType, bufferView.target);
            attributes[semantic] = newAccessorId;
        }
    }
    attributes.NORMAL = createAccessor(gltf, packArray(generatedNormals, WebGLConstants.FLOAT_VEC3), 'VEC3', WebGLConstants.FLOAT, WebGLConstants.ARRAY_BUFFER);

    if (defined(indicesAccessorId)) {
        indices = [];
        for (var k = 0; k < generatedNormals.length; k++) {
            indices.push(k);
        }
        if (generatedNormals.length > 65535) {
            primitive.indices = createAccessor(gltf, indices, 'SCALAR', WebGLConstants.UNSIGNED_INT, WebGLConstants.ELEMENT_ARRAY_BUFFER);
        } else {
            writeAccessor(gltf, indicesAccessor, indices);
        }
    }
}

/**
 * Checks the primitive material/technique for NORMAL support. If it already exists, do nothing.
 * If the technique has no NORMAL parameter, generate a new KHR_materials_common BLINN technique
 * and shader using the existing material values. This ensures that models with newly generated normals
 * actually use them for shading.
 *
 * @private
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} primitive A javascript object containing a glTF primitive.
 * @param {Object} generatedMaterials Global map from materialId -> generatedMaterialId. If a material has already been generated, it can be reused.
 */
function generateMaterial(gltf, primitive, generatedMaterials) {
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
    var normalParameter;
    if (defined(techniqueId)) {
        var technique = techniques[techniqueId];
        normalParameter = techniqueParameterForSemantic(technique, 'NORMAL');
    }
    if (!defined(normalParameter)) {
        addExtensionsUsed(gltf, 'KHR_materials_common');
        generatedMaterialId = getUniqueId(gltf, materialId + '-common');
        var values = clone(material.values);
        values.doubleSided = true;

        var diffuseColor = values.diffuse;
        var transparency = values.transparency;

        // Check if we have transparency and set transparent flag
        if ((defined(transparency) && transparency < 1.0) ||
            (defined(diffuseColor) && Array.isArray(diffuseColor) && diffuseColor[3] < 1.0)) {
            values.transparent = true;
        } else if (typeof diffuseColor === 'string') {
            values.transparent = gltf.images[gltf.textures[diffuseColor].source].extras._pipeline.transparent;
        }

        materials[generatedMaterialId] = {
            extensions : {
                KHR_materials_common : {
                    technique : 'BLINN',
                    values : values,
                    extras: {
                        _pipeline: {}
                    }
                }
            }
        };
        primitive.material = generatedMaterialId;
        generatedMaterials[materialId] = generatedMaterialId;
    }
}
