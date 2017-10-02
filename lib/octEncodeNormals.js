'use strict';
var Cesium = require('cesium');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var ForEach = require('./ForEach');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');
var writeBufferComponent = require('./writeBufferComponent');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var ShaderSource = Cesium.ShaderSource;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

module.exports = octEncodeNormals;

/**
 * Oct-encodes the normal vectors of this model, converting each normal vector from three floating point numbers
 * down to two bytes. Modifies the model shader for decoding.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A glTF hierarchy.
 * @returns {Object} The glTF asset with oct-encoded normals when the operation completes.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function octEncodeNormals(gltf) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    var patchedTechniques = {};
    var patchedPrograms = {};
    var patchedShaders = {};

    /* jshint unused:vars */
    ForEach.accessorWithSemantic(gltf, 'NORMAL', function(accessorId, semantic, primitive) {
        var accessor = accessors[accessorId];
        if (canOctEncode(accessor, primitive)) {
            // Oct-encode normals to 2-bytes
            var bufferViewId = accessor.bufferView;
            var bufferView = bufferViews[bufferViewId];
            var bufferId = bufferView.buffer;
            var buffer = buffers[bufferId];
            var source = buffer.extras._pipeline.source;
            var byteStride = getAccessorByteStride(gltf, accessor);
            var byteOffset = accessor.byteOffset + bufferView.byteOffset;
            var componentType = accessor.componentType;
            var newComponentType = WebGLConstants.UNSIGNED_BYTE;
            var componentByteLength = byteLengthForComponentType(componentType);
            var newComponentByteLength = byteLengthForComponentType(newComponentType);
            var numElements = accessor.count;
            var numComponents = numberOfComponentsForType(accessor.type);
            for (var j = 0; j < numElements; j++) {
                var elementArray = [];
                for (var k = 0; k < numComponents; k++) {
                    var element = readBufferComponent(source, componentType, byteOffset + componentByteLength * k);
                    elementArray.push(element);
                }
                var normalVector = Cartesian3.fromArray(elementArray);
                Cartesian3.normalize(normalVector, normalVector);
                var octEncodedVector = new Cartesian2();
                AttributeCompression.octEncode(normalVector, octEncodedVector);
                writeBufferComponent(source, newComponentType, octEncodedVector.x, byteOffset);
                writeBufferComponent(source, newComponentType, octEncodedVector.y, byteOffset + newComponentByteLength);
                byteOffset += byteStride;
            }
            bufferView.byteStride = byteStride;
            accessor.componentType = newComponentType;
            accessor.type = 'VEC2';
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
    });
    return gltf;
}

function canOctEncode(accessor) {
    return accessor.type === 'VEC3' && accessor.componentType === WebGLConstants.FLOAT;
}

function patchTechnique(gltf, techniqueId) {
    var techniques = gltf.techniques;
    var technique = techniques[techniqueId];
    var normalParameterName;
    ForEach.techniqueParameter(technique, function(parameter, parameterName) {
        var semantic = parameter.semantic;
        if (semantic === 'NORMAL') {
            normalParameterName = parameterName;
            parameter.type = WebGLConstants.INT_VEC2;
            return true;
        }
    });
    var normalVariableName;
    if (!defined(normalParameterName)) {
        throw new DeveloperError('NORMAL semantic in technique' + techniqueId +  ' doesn\'t have a defined parameter');
    } else {
        ForEach.techniqueAttribute(technique, function(attributeParameterName, attributeVariableName) {
            if (attributeParameterName === normalParameterName) {
                normalVariableName = attributeVariableName;
                return true;
            }
        });
    }
    return normalVariableName;
}

function patchProgram(gltf, programId, normalVariableName, patchedShaders) {
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

    var newVariableName = 'czm_oct_dec_a_normal';
    shader = shader.replace('attribute vec3 ' + normalVariableName + ';', '');
    shader = shader.replace(new RegExp(normalVariableName, 'g'), newVariableName);
    shader = 'attribute vec2 ' + normalVariableName + ';\n' +
             'vec3 ' + newVariableName + ';\n' + shader;
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
    shader = source.createCombinedVertexShader(defaultValue.EMPTY_OBJECT);
    shader = shader.replace(new RegExp('czm_', 'g'), 'gltf_');
    pipelineExtras.source = shader;
    patchedShaders[vertexShaderId] = true;
}
