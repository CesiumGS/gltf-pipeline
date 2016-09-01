'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var findAccessorMinMax = require('./findAccessorMinMax');
var getUniqueId = require('./getUniqueId');
var mergeBuffers = require('./mergeBuffers');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var writeAccessor = require('./writeAccessor');

module.exports = cesiumGeometryToGltfPrimitive;

// Creates a buffer location to write the new values to. mapGeometryAttributeToPrimitive does the actual writing
function createAttributeSemantic(gltf, primitive, semantic, packedLength) {
    var type;
    if (semantic.indexOf('POSITION') === 0 || semantic.indexOf('NORMAL') === 0) {
        type = 'VEC3';
    } else if (semantic.indexOf('TEXCOORD') === 0) {
        type = 'VEC2';
    }

    var bytesPerComponent = 4;
    var componentsPerType = numberOfComponentsForType(type);
    var attributeLength = packedLength / componentsPerType;

    var bufferLength = attributeLength * componentsPerType * bytesPerComponent;
    var buffer = new Buffer(bufferLength);

    var lowercaseSemantic = semantic.toLowerCase();

    var bufferId = getUniqueId(gltf, 'buffer_' + lowercaseSemantic + '_generated');
    var bufferViewId = getUniqueId(gltf, 'bufferView_' + lowercaseSemantic + '_generated');
    var accessorId = getUniqueId(gltf, 'accessor_' + lowercaseSemantic + '_generated');

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

/**
 * @private
 */
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
