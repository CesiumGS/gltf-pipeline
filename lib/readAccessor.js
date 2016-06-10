'use strict';
var Cesium = require('cesium');
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var byteLengthForComponentType = require('./byteLengthForComponentType');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponentType = require('./readBufferComponentType');

module.exports = readAccessor;

// read the accessor shown and return an array containing its contents
// VECx types become CartesianX
// MATx types become MatrixX
function readAccessor(accessor, gltf) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var buffer = gltf.buffers[bufferView.buffer];
    var source = buffer.extras._pipeline.source;
    var attributeCount = accessor.count;
    var componentCount = numberOfComponentsForType(accessor.type);
    var componentBytes = byteLengthForComponentType(accessor.componentType);
    var attributeStride = componentCount * componentBytes;
    var accessorType = accessor.type;
    var componentType = accessor.componentType;
    var attributes = [];
    var currentBufferIndex = accessor.byteOffset + bufferView.byteOffset;

    var generateAttributeFunction;
    var type = '';

    switch (accessorType) {
        case 'SCALAR':
            generateAttributeFunction = function(values) {
                return values[0];
            };
            type = 'number';
            break;
        case 'VEC2':
            generateAttributeFunction = Cartesian2.fromArray;
            type = 'Cartesian2';
            break;
        case 'VEC3':
            generateAttributeFunction = Cartesian3.fromArray;
            type = 'Cartesian3';
            break;
        case 'VEC4':
            generateAttributeFunction = Cartesian4.fromArray;
            type = 'Cartesian4';
            break;
        case 'MAT2':
            generateAttributeFunction = Matrix2.fromArray;
            type = 'Matrix2';
            break;
        case 'MAT3':
            generateAttributeFunction = Matrix3.fromArray;
            type = 'Matrix3';
            break;
        case 'MAT4':
            generateAttributeFunction = Matrix4.fromArray;
            type = 'Matrix4';
            break;
    }

    // walk over the buffer, reading the attributes
    for (var i = 0; i < attributeCount; i++) {
        // get this attribute's data
        var values = [];
        var internalBufferIndex = currentBufferIndex;
        for (var j = 0; j < componentCount; j++) {
            values.push(readBufferComponentType(source, componentType, internalBufferIndex));
            internalBufferIndex += componentBytes;
        }
        attributes.push(generateAttributeFunction(values));
        currentBufferIndex += attributeStride;
    }
    return {
        type : type,
        data : attributes
    };
}
