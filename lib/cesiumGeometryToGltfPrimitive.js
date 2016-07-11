'use strict';
var findAccessorMinMax = require('./findAccessorMinMax');
var writeAccessor = require('./writeAccessor');
var mergeBuffers = require('./mergeBuffers');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var Cesium = require('cesium');
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;


module.exports = cesiumGeometryToGltfPrimitive;

function createAttributeSemantic(gltf, primitive, semantic, attributeLength) {
    var type;
    var bytesPerComponent;

    switch (semantic.replace(/([0-9]|_)/g, '')) {
        case 'POSITION':
            type = 'VEC3';
            bytesPerComponent = 8;
            break;
        case 'NORMAL':
            type = 'VEC3';
            bytesPerComponent = 4;
            break;
        case 'TEXCOORD':
            type = 'VEC2';
            bytesPerComponent = 4;
    }

    var componentsPerType = numberOfComponentsForType(type);

    var bufferLength = attributeLength * componentsPerType * bytesPerComponent;
    var buffer = new Buffer(bufferLength);

    var lowercaseSemantic = semantic.toLowerCase();
    var bufferId = 'buffer_' + lowercaseSemantic + '_generated';
    var bufferViewId = 'bufferView_' + lowercaseSemantic + '_generated';
    var accessorId = 'accessor_' + lowercaseSemantic + '_generated';

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

    // Find min/max for normal accessor
    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;

    primitive.attributes[semantic] = accessorId;
    mergeBuffers(gltf, 'buffer_0');
    uninterleaveAndPackBuffers(gltf);
}

// Get the first gltf attribute semantic of that type
function getFirstAttributeSemantic(gltf, primitive, semantic, options) {
    var attributeLength;
    if (defined(options)) {
        attributeLength = options.attributeLength;
    }
    var attributes = primitive.attributes;
    for (var attributeSemantic in attributes) {
        if (attributes.hasOwnProperty(attributeSemantic)) {
            if (attributeSemantic.indexOf(semantic) === 0) {
                return attributeSemantic;
            }
        }
    }
    // If the primitive does not have the corresponding attribute, make one
    createAttributeSemantic(gltf, primitive, semantic, attributeLength);
    return semantic;
}

// Helper function to write attributes to gltf primitive from cesium geometry
function mapGeometryAttributeToPrimitive(gltf, primitive, geometry, semantic, options) {
    var attributeSemantic;
    var values;

    switch(semantic) {
        case 'position':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'POSITION', options);
            values = geometry.attributes.position.values;
            break;
        case 'normal':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'NORMAL', options);
            values = geometry.attributes.normal.values;
            break;
        case 'st':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'TEXCOORD', options);
            values = geometry.attributes.st.values;
            break;
        default:
            attributeSemantic = semantic;
            values = geometry.attributes[semantic].values;
    }
    var accessorId = primitive.attributes[attributeSemantic];
    var accessor = gltf.accessors[accessorId];
    writeAccessor(gltf, accessor, values);
}

function cesiumGeometryToGltfPrimitive(gltf, primitive, geometry, options) {
    var attributes = geometry.attributes;
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
             mapGeometryAttributeToPrimitive(gltf, primitive, geometry, semantic, options);
        }
    }
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    writeAccessor(gltf, indicesAccessor, geometry.indices);
}
