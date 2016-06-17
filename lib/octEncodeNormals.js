'use strict';
var Cesium = require('cesium');
var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var ShaderSource = Cesium.ShaderSource;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

var getAccessorByteStride = require('./getAccessorByteStride');
var readBufferComponentType = require('./readBufferComponentType');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var writeBufferComponentType = require('./writeBufferComponentType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');

module.exports = octEncodeNormals;

function octEncodeNormals(gltf) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    var normalAccessors = getNormalAccessors(gltf);
    var patchedTechniques = {};
    var patchedPrograms = {};
    for (var normalAccessorId in normalAccessors) {
        if (normalAccessors.hasOwnProperty(normalAccessorId)) {
            var accessor = accessors[normalAccessorId];
            var primitive = normalAccessors[normalAccessorId];
            if (canOctEncode(accessor, primitive)) {
                // Oct-encode these normals
                var bufferViewId = accessor.bufferView;
                var bufferView = bufferViews[bufferViewId];
                var bufferId = bufferView.buffer;
                var buffer = buffers[bufferId];
                var source = buffer.extras._pipeline.source;
                var byteStride = getAccessorByteStride(accessor);
                var byteOffset = accessor.byteOffset + bufferView.byteOffset;
                var componentType = accessor.componentType;
                var newComponentType = WebGLConstants.UNSIGNED_BYTE;
                var componentByteLength = byteLengthForComponentType(componentType);
                var newComponentByteLength = byteLengthForComponentType(newComponentType);
                var numElements = accessor.count;
                var numComponents = numberOfComponentsForType(accessor.type);
                var elementArray = [];
                for (var j = 0; j < numElements; j++) {
                    for (var k = 0; k < numComponents; k++) {
                        var element = readBufferComponentType(source, componentType, byteOffset + componentByteLength * k);
                        elementArray.push(element);
                    }
                    var normalVector = Cartesian3.fromArray(elementArray);
                    var octEncodedVector = new Cartesian2();
                    AttributeCompression.octEncode(normalVector, octEncodedVector);
                    writeBufferComponentType(source, newComponentType, octEncodedVector.x, byteOffset);
                    writeBufferComponentType(source, newComponentType, octEncodedVector.x, byteOffset + newComponentByteLength);
                    byteOffset += byteStride;
                }
                accessor.componentType = newComponentType;
                accessor.type = 'VEC2';
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
                    patchProgram(gltf, programId, attributeVariableName);
                    patchedPrograms[programId] = true;
                }
            }
        }
    }
    uninterleaveAndPackBuffers(gltf);
}

function canOctEncode(accessor) {
    return accessor.type === 'VEC3' && accessor.componentType === WebGLConstants.FLOAT;
}

function getNormalAccessors(gltf) {
    var meshes = gltf.meshes;
    var accessors = {};
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var primitiveAttributes = primitive.attributes;
                for (var semantic in primitiveAttributes) {
                    if (primitiveAttributes.hasOwnProperty(semantic)) {
                        if (semantic === 'NORMAL') {
                            accessors[primitiveAttributes[semantic]] = primitive;
                        }
                    }
                }
            }
        }
    }
    return accessors;
}

function patchTechnique(gltf, techniqueId) {
    var techniques = gltf.techniques;
    var technique = techniques[techniqueId];
    var attributes = technique.attributes;
    var parameters = technique.parameters;
    var normalParameterName;
    for (var parameterName in parameters) {
        if (parameters.hasOwnProperty(parameterName)) {
            var parameter = parameters[parameterName];
            var semantic = parameter.semantic;
            if (semantic === 'NORMAL') {
                normalParameterName = parameterName;
                parameter.type = WebGLConstants.UNSIGNED_INT_VEC2;
                break;
            }
        }
    }
    if (!defined(normalParameterName)) {
        throw new DeveloperError('NORMAL semantic in technique' + techniqueId +  ' doesn\'t have a defined parameter');
    } else {
        for (var attributeVariableName in attributes) {
            if (attributes.hasOwnProperty(attributeVariableName)) {
                var attributeParameterName = attributes[attributeVariableName];
                if (attributeParameterName === normalParameterName) {
                    return attributeVariableName;
                }
            }
        }
    }
}

function patchProgram(gltf, programId, normalVariableName) {
    var programs = gltf.programs;
    var shaders = gltf.shaders;
    var program = programs[programId];
    var vertexShaderId = program.vertexShader;
    var vertexShader = shaders[vertexShaderId];
    var pipelineExtras = vertexShader.extras._pipeline;
    var shader = pipelineExtras.source;
    var newVariableName = 'czm_oct_dec_a_normal';
    shader.replace(new RegExp(normalVariableName, 'g'), newVariableName);
    shader = 'vec2 ' + normalVariableName + ';\n' + shader;
    var newMain = 'czm_oct_dec_normal';
    var octDecodeFunction = '\n' +
        'void main() {\n' +
        '    ' + newVariableName + ' = czm_octDecode(' + normalVariableName + ');\n' +
        '    ' + newMain + '();\n' +
        '}\n';
    shader = ShaderSource.replaceMain(shader, newMain);
    shader += octDecodeFunction;
    var source = new ShaderSource({
        sources : [shader],
        includeBuiltIns : true
    });
    shader = source.createCombinedVertexShader();
    pipelineExtras.source = shader;
}