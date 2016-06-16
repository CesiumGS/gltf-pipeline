'use strict';
var readAccessor = require('./readAccessor');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var modeToPrimitiveType = require('./modeToPrimitiveType');
var Cesium = require('cesium');
var Geometry = Cesium.Geometry;
var GeometryAttribute = Cesium.GeometryAttribute;
var ComponentDatatype = Cesium.ComponentDatatype;

module.exports = readGltfGeometry;

function readGltfGeometry(gltf, primitive) {
    var positionId = primitive.attributes.POSITION;
    var positionAccessor = gltf.accessors[positionId];
    var componentsPerAttribute = numberOfComponentsForType(positionAccessor.type);
    var values = readAccessor(gltf, positionAccessor);
    
    var packedValues = [];
    for (var i = 0; i < values.data.length; i++) {
        packedValues.push(values.data[i].x);
        packedValues.push(values.data[i].y);
        packedValues.push(values.data[i].z);
    }
    
    var position = new GeometryAttribute({
        'componentDatatype' : ComponentDatatype.FLOAT,
        'componentsPerAttribute' : componentsPerAttribute,
        'values' : new Float64Array(packedValues)
    });

    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    var indices = readAccessor(gltf, indicesAccessor);
    var primitiveType = modeToPrimitiveType(primitive.mode);

    var geometry = new Geometry({
        'attributes' : {
            'position' : position
        },
        'indices' : new Uint32Array(indices.data),
        'primitiveType' : primitiveType
    });
    return geometry;
}
