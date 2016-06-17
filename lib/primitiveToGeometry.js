'use strict';
var readAccessor = require('./readAccessor');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var modeToPrimitiveType = require('./modeToPrimitiveType');
var Cesium = require('cesium');
var Geometry = Cesium.Geometry;
var GeometryAttribute = Cesium.GeometryAttribute;
var ComponentDatatype = Cesium.ComponentDatatype;
var Cartesian3 = Cesium.Cartesian3;

module.exports = primitiveToGeometry;

function primitiveToGeometry(gltf, primitive) {
    var positionId = primitive.attributes.POSITION;
    var positionAccessor = gltf.accessors[positionId];
    var componentsPerAttribute = numberOfComponentsForType(positionAccessor.type);
    var values = readAccessor(gltf, positionAccessor);
    
    var packedValues = [];
    packedValues.length = values.data.length * 3;

    for (var i = 0; i < values.data.length; ++i) {
        Cartesian3.pack(values.data[i], packedValues, i * 3);
    }
    
    var position = new GeometryAttribute({
        componentDatatype : ComponentDatatype.FLOAT,
        componentsPerAttribute : componentsPerAttribute,
        values : new Float64Array(packedValues)
    });

    var normalId = primitive.attributes.NORMAL;
    var normalAccessor = gltf.accessors[normalId];
    var normal = readAccessor(gltf, normalAccessor);

    var packedNormal = [];
    packedNormal.length = normal.data.length * 3;

    for (i = 0; i < normal.data.length; ++i) {
        Cartesian3.pack(normal.data[i], packedNormal, i * 3);
    }
    
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    var indices = readAccessor(gltf, indicesAccessor);
    var primitiveType = modeToPrimitiveType(primitive.mode);

    var geometry = new Geometry({
        attributes : {
            position : position,
            normal : new Float32Array(packedNormal)
        },
        indices : new Uint32Array(indices.data),
        primitiveType : primitiveType
    });
    return geometry;
}
