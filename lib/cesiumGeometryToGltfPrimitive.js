'use strict';
var writeAccessor = require('./writeAccessor');

module.exports = cesiumGeometryToGltfPrimitive;

// Helper method to write attributes to gltf primitive from cesium geometry
function mapGeometryAttributeToPrimitive(gltf, primitive, geometry, attributeId) {
    var accessorId;
    var values;
    switch(attributeId) {
        case 'position':
            accessorId = primitive.attributes.POSITION;
            values = geometry.attributes.position.values;
            break;
        case 'normal':
            accessorId = primitive.attributes.NORMAL;
            values = geometry.attributes.normal.values;
            break;
        case 'st':
            accessorId = primitive.attributes.TEXCOORD_0;
            values = geometry.attributes.st.values;
            break;
        default:
            accessorId = primitive.attributes[attributeId];
            values = geometry.attributes[attributeId].values;
    }
    var accessor = gltf.accessors[accessorId];
    writeAccessor(gltf, accessor, values);
}

function cesiumGeometryToGltfPrimitive(gltf, primitive, geometry) {
    var attributes = geometry.attributes;
    for (var attributeId in attributes) {
        if (attributes.hasOwnProperty(attributeId)) {
             mapGeometryAttributeToPrimitive(gltf, primitive, geometry, attributeId);
        }
    }
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    writeAccessor(gltf, indicesAccessor, geometry.indices);
}
