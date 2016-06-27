'use strict';
var writeAccessor = require('./writeAccessor');

module.exports = cesiumGeometryToGltfPrimitive;

// Get the first gltf attribute semantic of that type
function getFirstAttributeSemantic(primitive, semantic) {
    var attributes = primitive.attributes;
    for (var attributeSemantic in attributes) {
        if (attributes.hasOwnProperty(attributeSemantic)) {
            if (attributeSemantic.indexOf(semantic) === 0) {
                return attributeSemantic;
            }
        }
    }
}

// Helper method to write attributes to gltf primitive from cesium geometry
function mapGeometryAttributeToPrimitive(gltf, primitive, geometry, semantic) {
    var attributeSemantic;
    var values;

    switch(semantic) {
        case 'position':
            attributeSemantic = getFirstAttributeSemantic(primitive, 'POSITION');
            values = geometry.attributes.position.values;
            break;
        case 'normal':
            attributeSemantic = getFirstAttributeSemantic(primitive, 'NORMAL');
            values = geometry.attributes.normal.values;
            break;
        case 'st':
            attributeSemantic = getFirstAttributeSemantic(primitive, 'TEXCOORD');
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
}
