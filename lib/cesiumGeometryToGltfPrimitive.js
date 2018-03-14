'use strict';
var Cesium = require('cesium');

var createAccessor = require('./createAccessor');
var findAccessorMinMax = require('./findAccessorMinMax');
var getPrimitiveAttributeSemantics = require('./getPrimitiveAttributeSemantics');
var getUniqueId = require('./getUniqueId');
var mergeBuffers = require('./mergeBuffers');
var uninterleaveAndPackBuffers = require('./uninterleaveAndPackBuffers');
var writeAccessor = require('./writeAccessor');

var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = cesiumGeometryToGltfPrimitive;

function getFirstAttributeSemantic(gltf, primitive, semantic, packedLength) {
    var semantics = getPrimitiveAttributeSemantics(primitive, semantic);
    var type;
    if (semantic === 'TEXCOORD') {
        type = 'VEC2';
    } else if (semantic.indexOf('POSITION')  === 0 ||
               semantic.indexOf('NORMAL')    === 0 ||
               semantic.indexOf('TANGENT')   === 0 ||
               semantic.indexOf('BITANGENT') === 0   ) {
        type = 'VEC3';
    } else {
        throw new DeveloperError('Unsupported attribute semantic: ' + semantic);
    }
    if (semantics.length <= 0) {

        var id;

        // all attributes but texcoords may occur only once
        if (semantic !== 'TEXCOORD') {
            id = getUniqueId(gltf, 'accessor_' + semantic.toLowerCase());
        }

        primitive.attributes[semantic] = createAccessor(gltf, packedLength, type,
                                                        WebGLConstants.FLOAT, WebGLConstants.ARRAY_BUFFER, id);
        return semantic;
    }
    return semantics[0];
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
        case 'tangent':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'TANGENT', packedAttributeLength);
            values = geometry.attributes.tangent.values;
            break;
        case 'bitangent':
            attributeSemantic = getFirstAttributeSemantic(gltf, primitive, 'BITANGENT', packedAttributeLength);
            values = geometry.attributes.bitangent.values;
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
    mergeBuffers(gltf);
    uninterleaveAndPackBuffers(gltf);
}
