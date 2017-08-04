'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var ShaderSource = Cesium.ShaderSource;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var getAccessorByteStride = require('./getAccessorByteStride');
var getAccessorsForSemantic = require('./getAccessorsForSemantic');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var writeBufferComponent = require('./writeBufferComponent');

module.exports = compressTextureCoordinates;

/**
 * Compresses the texture coordinates of this model, packing each texture coordinates from two floating-point numbers
 * into one. Modifies the model shader for decoding.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Promise} A promise that resolves to the glTF asset with compressed texture coordinates.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function compressTextureCoordinates(gltf) {
    return new Promise(function(resolve) {
        var accessors = gltf.accessors;
        var bufferViews = gltf.bufferViews;
        var buffers = gltf.buffers;
        var materials = gltf.materials;
        var techniques = gltf.techniques;
        var patchedTechniques = {};
        var patchedPrograms = {};
        var patchedShaders = {};

        getAccessorsForSemantic(gltf, 'TEXCOORD', function(gltf, primitive, accessorId) {
            var accessor = accessors[accessorId];
            if (canCompress(accessor, primitive)) {
                // Compress texture coordinates to a single float
                var bufferViewId = accessor.bufferView;
                var bufferView = bufferViews[bufferViewId];
                var bufferId = bufferView.buffer;
                var buffer = buffers[bufferId];
                var source = buffer.extras._pipeline.source;
                var byteStride = getAccessorByteStride(accessor);
                var byteOffset = accessor.byteOffset + bufferView.byteOffset;
                var componentType = accessor.componentType;
                var newComponentType = WebGLConstants.FLOAT;
                var componentByteLength = byteLengthForComponentType(componentType);
                var numElements = accessor.count;
                var numComponents = numberOfComponentsForType(accessor.type);
                for (var j = 0; j < numElements; j++) {
                    var elementArray = [];
                    for (var k = 0; k < numComponents; k++) {
                        var element = readBufferComponent(source, componentType, byteOffset + componentByteLength * k);
                        elementArray.push(element);
                    }
                    var texCoord = Cartesian2.fromArray(elementArray);
                    var compressed = AttributeCompression.compressTextureCoordinates(texCoord);
                    writeBufferComponent(source, newComponentType, compressed, byteOffset);
                    byteOffset += byteStride;
                }
                accessor.byteStride = byteStride;
                accessor.componentType = newComponentType;
                accessor.type = 'SCALAR';
                var minMax = findAccessorMinMax(gltf, accessor);
                accessor.min = minMax.min;
                accessor.max = minMax.max;
                var materialId = primitive.material;
                var material = materials[materialId];
                var techniqueId = material.technique;
                var attributeVariableName = patchedTechniques[techniqueId];
                if (!defined(patchedTechniques[techniqueId])) {
                    attributeVariableName = patchTechnique(gltf, techniqueId);
                    patchedTechniques[techniqueId] = attributeVariableName;
                }
                var technique = techniques[techniqueId];
                var programId = technique.program;
                if (!defined(patchedPrograms[programId])) {
                    patchProgram(gltf, programId, attributeVariableName, patchedShaders);
                    patchedPrograms[programId] = true;
                }
            }
        }).then(function() {
            uninterleaveAndPackBuffers(gltf);
            resolve(gltf);
        });
    });
}

function canCompress(accessor) {
    var min = Math.min.apply(null, accessor.min);
    var max = Math.max.apply(null, accessor.max);
    return accessor.type === 'VEC2' && accessor.componentType === WebGLConstants.FLOAT && min >= 0.0 && max <= 1.0;
}

function patchTechnique(gltf, techniqueId) {
    var techniques = gltf.techniques;
    var technique = techniques[techniqueId];
    var attributes = technique.attributes;
    var parameters = technique.parameters;
    var texCoordParameterName;
    for (var parameterName in parameters) {
        if (parameters.hasOwnProperty(parameterName)) {
            var parameter = parameters[parameterName];
            var semantic = parameter.semantic;
            if (defined(semantic)) {
                if (semantic.indexOf('TEXCOORD') === 0) {
                    texCoordParameterName = parameterName;
                    parameter.type = WebGLConstants.FLOAT;
                    break;
                }
            }
        }
    }
    if (!defined(texCoordParameterName)) {
        throw new DeveloperError('TEXCOORD semantic in technique' + techniqueId +  ' doesn\'t have a defined parameter');
    } else {
        for (var attributeVariableName in attributes) {
            if (attributes.hasOwnProperty(attributeVariableName)) {
                var attributeParameterName = attributes[attributeVariableName];
                if (attributeParameterName === texCoordParameterName) {
                    return attributeVariableName;
                }
            }
        }
    }
}

function patchProgram(gltf, programId, texCoordVariableName, patchedShaders) {
    var programs = gltf.programs;
    var shaders = gltf.shaders;
    var program = programs[programId];
    var vertexShaderId = program.vertexShader;
    if (defined(patchedShaders[vertexShaderId])) {
        return;
    }
    var vertexShader = shaders[vertexShaderId];
    var pipelineExtras = vertexShader.extras._pipeline;
    var shader = pipelineExtras.source;
    var newVariableName = 'czm_com_' + texCoordVariableName;
    shader = shader.replace('attribute vec2 ' + texCoordVariableName + ';', '');
    shader = shader.replace(new RegExp(texCoordVariableName, 'g'), newVariableName);
    shader = 'attribute float ' + texCoordVariableName + ';\n' +
        'vec2 ' + newVariableName + ';\n' + shader;
    var newMain = 'czm_com_texcoord_' + texCoordVariableName;
    var octDecodeFunction = '\n' +
        'void main() {\n' +
        '    ' + newVariableName + ' = czm_decompressTextureCoordinates(' + texCoordVariableName + ');\n' +
        '    ' + newMain + '();\n' +
        '}\n';
    shader = ShaderSource.replaceMain(shader, newMain);
    shader += octDecodeFunction;
    var source = new ShaderSource({
        sources : [shader],
        includeBuiltIns : true
    });
    shader = source.createCombinedVertexShader(defaultValue.EMPTY_OBJECT);
    shader = shader.replace(new RegExp('czm_', 'g'), 'gltf_');
    pipelineExtras.source = shader;
    patchedShaders[vertexShaderId] = true;
}
