'use strict';
var writeAccessor = require('./writeAccessor');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = geometryToPrimitive;

function geometryToPrimitive(gltf, primitive, geometry) {
    var positionId = primitive.attributes.POSITION;
    var positionAccessor = gltf.accessors[positionId];
    var positionValues = geometry.attributes.position.values;
    writeAccessor(gltf, positionAccessor, positionValues);

    if (defined(primitive.attributes.NORMAL)) {
        var normalId = primitive.attributes.NORMAL;
        var normalAccessor = gltf.accessors[normalId];
        var normalValues = geometry.attributes.normal.values;
        writeAccessor(gltf, normalAccessor, normalValues);
    }
    
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    writeAccessor(gltf, indicesAccessor, geometry.indices);
}
