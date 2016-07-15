'use strict';
var Cesium = require('cesium');
var findAccessorMinMax = require('./findAccessorMinMax');
var mergeBuffers = require('./mergeBuffers');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var writeAccessor = require('./writeAccessor');

var WebGLConstants = Cesium.WebGLConstants;

module.exports = cesiumGeometryToGltfPrimitive;

// Get the next Id index to ensure generated buffers/bufferViews/accessors don't overwrite each other
function getIdNumber(gltf) {
    var max = 0;
    var accessors = gltf.accessors;
    for (var accessor in accessors) {
        var accessorInfo = accessor.split('_');
        // Only count generated accessors
        if (accessorInfo[2] === 'generated') {
            // Find the highest index
            var idNumber = accessorInfo[3];
            if (idNumber >= max) {
                max = idNumber + 1;
            }
        }
    }
    return max;
}

// Creates a buffer location to write the new values to. mapGeometryAttributeToPrimitive does the actual writing
function createAttributeSemantic(gltf, primitive, semantic, packedLength) {
    var type;
    switch (semantic.replace(/([0-9]|_)/g, '')) {
        case 'POSITION':
        case 'NORMAL':
            type = 'VEC3';
            break;
        case 'TEXCOORD':
            type = 'VEC2';
    }

    var bytesPerComponent = 4;
    var componentsPerType = numberOfComponentsForType(type);
    var attributeLength = packedLength / componentsPerType;

    var bufferLength = attributeLength * componentsPerType * bytesPerComponent;
    var buffer = new Buffer(bufferLength);

    var idNumber = getIdNumber(gltf);

    var lowercaseSemantic = semantic.toLowerCase();
    var bufferId = 'buffer_' + lowercaseSemantic + '_generated_' + idNumber;
    var bufferViewId = 'bufferView_' + lowercaseSemantic + '_generated_' + idNumber;
    var accessorId = 'accessor_' + lowercaseSemantic + '_generated_' + idNumber;

    gltf.buffers[bufferId] = {
        byteLength : bufferLength,
        type : 'arraybuffer',
        extras : {
            _pipeline : {
                source : buffer,
                extension : '.bin'
            }
        }
    };

    gltf.bufferViews[bufferViewId] = {
        buffer : bufferId,
        byteLength : bufferLength,
        byteOffset : 0,
        target : WebGLConstants.ARRAY_BUFFER
    };

    var accessor = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.FLOAT,
        count : attributeLength,
        type : type
    };

    gltf.accessors[accessorId] = accessor;
    primitive.attributes[semantic] = accessorId;
}

// Get the first gltf attribute semantic of that type
function getFirstAttributeSemantic(gltf, primitive, semantic, packedLength) {
    var attributes = primitive.attributes;
    for (var attributeSemantic in attributes) {
        if (attributes.hasOwnProperty(attributeSemantic)) {
            if (attributeSemantic.indexOf(semantic) === 0) {
                return attributeSemantic;
            }
        }
    }
    // If the primitive does not have the corresponding attribute, make one
    createAttributeSemantic(gltf, primitive, semantic, packedLength);
    return semantic;
}

// Helper function to write attributes to gltf primitive from cesium geometry
function mapGeometryAttributeToPrimitive(gltf, primitive, geometry, semantic) {
    var attributeSemantic;
    var values;
    var packedAttributeLength = geometry.attributes.position.values.length;

    switch(semantic) {
        case 'position':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'POSITION', packedAttributeLength);
            values = geometry.attributes.position.values;
            break;
        case 'normal':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'NORMAL', packedAttributeLength);
            values = geometry.attributes.normal.values;
            break;
        case 'st':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'TEXCOORD', packedAttributeLength);
            values = geometry.attributes.st.values;
            break;
        default:
            attributeSemantic = semantic;
            values = geometry.attributes[semantic].values;
    }
    var accessorId = primitive.attributes[attributeSemantic];
    var accessor = gltf.accessors[accessorId];
    writeAccessor(gltf, accessor, values);

    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;
}

function cesiumGeometryToGltfPrimitive(gltf, primitive, geometry) {
    var attributes = geometry.attributes;
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
            mapGeometryAttributeToPrimitive(gltf, primitive, geometry, semantic);
        }
    }
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    writeAccessor(gltf, indicesAccessor, geometry.indices);
    mergeBuffers(gltf, 'buffer_0');
    uninterleaveAndPackBuffers(gltf);
}
