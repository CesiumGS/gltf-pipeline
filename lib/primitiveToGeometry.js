'use strict';
var readAccessor = require('./readAccessor');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var modeToPrimitiveType = require('./modeToPrimitiveType');
var Cesium = require('cesium');
var Geometry = Cesium.Geometry;
var GeometryAttribute = Cesium.GeometryAttribute;
var ComponentDatatype = Cesium.ComponentDatatype;
var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;

module.exports = primitiveToGeometry;

function primitiveToGeometry(gltf, primitive) {
    var positionId = primitive.attributes.POSITION;
    var positionAccessor = gltf.accessors[positionId];
    var componentsPerPosition = numberOfComponentsForType(positionAccessor.type);
    var positionValues = readAccessor(gltf, positionAccessor);
    var positionLength = positionValues.data.length;

    var packedPositions = new Array(positionLength * 3);
    for (var i = 0; i < positionLength; ++i) {
        Cartesian3.pack(positionValues.data[i], packedPositions, i * 3);
    }
    
    var positionAttribute = new GeometryAttribute({
        componentDatatype : ComponentDatatype.FLOAT,
        componentsPerAttribute : componentsPerPosition,
        values : new Float64Array(packedPositions)
    });
    
    var normalAttribute;
    if (defined(primitive.attributes.NORMAL)) {
        var normalId = primitive.attributes.NORMAL;
        var normalAccessor = gltf.accessors[normalId];
        var componentsPerNormal = numberOfComponentsForType(normalAccessor.type);
        var normalValues = readAccessor(gltf, normalAccessor);
        var normalLength = normalValues.data.length;

        var packedNormals = new Array(normalLength * 3);
        for (i = 0; i < normalLength; ++i) {
            Cartesian3.pack(normalValues.data[i], packedNormals, i * 3);
        }
        
        normalAttribute = new GeometryAttribute({
            componentDatatype: ComponentDatatype.FLOAT,
            componentsPerAttribute: componentsPerNormal,
            values: new Float32Array(packedNormals)
        });
    }
    
    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    var indices = readAccessor(gltf, indicesAccessor);
    var primitiveType = modeToPrimitiveType(primitive.mode);

    var geometry = new Geometry({
        attributes : {
            position : positionAttribute,
            normal : normalAttribute
        },
        indices : new Uint32Array(indices.data),
        primitiveType : primitiveType
    });
    return geometry;
}
