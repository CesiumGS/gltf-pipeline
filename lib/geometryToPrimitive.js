'use strict';
var writeAccessor = require('./writeAccessor');

module.exports = geometryToPrimitive;

function geometryToPrimitive(gltf, primitive, geometry) {
    var positionId = primitive.attributes.POSITION;
    var positionAccessor = gltf.accessors[positionId];

    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];

    var values = geometry.attributes.position.values;

    writeAccessor(gltf, positionAccessor, values);
    writeAccessor(gltf, indicesAccessor, geometry.indices);
}
