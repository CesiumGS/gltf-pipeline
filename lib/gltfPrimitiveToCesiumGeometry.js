'use strict';
var readAccessor = require('./readAccessor');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var Cesium = require('cesium');
var Geometry = Cesium.Geometry;
var GeometryAttribute = Cesium.GeometryAttribute;
var ComponentDatatype = Cesium.ComponentDatatype;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;

module.exports = gltfPrimitiveToCesiumGeometry;

// Helper method for packing Cartesians to arrays
function packArray(values) {
    var length = values.data.length;
    var packed;
    var i;
    switch (values.type) {
        case 'Cartesian2':
            packed = new Array(length * 2);
            for (i = 0; i < length; ++i) {
                Cartesian2.pack(values.data[i], packed, i * 2);
            }
            return packed;
        case 'Cartesian3':
            packed = new Array(length * 3);
            for (i = 0; i < length; ++i) {
                Cartesian3.pack(values.data[i], packed, i * 3);
            }
            return packed;
        case 'Cartesian4':
            packed = new Array(length * 4);
            for (i = 0; i < length; ++i) {
                Cartesian4.pack(values.data[i], packed, i * 4);
            }
            return packed;
    }
}

// Helper method for taking a gltf primitive attribute and returning a geometry attribute
function mapPrimitiveAttributeToGeometry(gltf, primitive, attributeId) {
    var accessorId = primitive.attributes[attributeId];
    var accessor = gltf.accessors[accessorId];
    var componentsPerAttribute = numberOfComponentsForType(accessor.type);
    var values = readAccessor(gltf, accessor);
    var packed = packArray(values);

    var attributeName;
    var finalValues;
    switch(attributeId) {
        case 'POSITION':
            attributeName = 'position';
            finalValues = new Float64Array(packed);
            break;
        case 'NORMAL':
            attributeName = 'normal';
            finalValues = new Float32Array(packed);
            break;
        case 'TEXCOORD_0':
            attributeName = 'st';
            finalValues = new Float32Array(packed);
            break;
        default:
            attributeName = attributeId;
            finalValues = new Float64Array(packed);
    }
    var options = {
        componentDatatype : ComponentDatatype.FLOAT,
        componentsPerAttribute : componentsPerAttribute,
        values : finalValues
    };
    return {
        name : attributeName,
        attribute : new GeometryAttribute(options)
    };
}

function gltfPrimitiveToCesiumGeometry(gltf, primitive) {
    var geometryAttributes = {};
    var attributes = primitive.attributes;
    for (var attributeId in attributes) {
        if (attributes.hasOwnProperty(attributeId)) {
            var nameAndAttribute = mapPrimitiveAttributeToGeometry(gltf, primitive, attributeId);
            geometryAttributes[nameAndAttribute.name] = nameAndAttribute.attribute;
        }
    }

    var indicesId = primitive.indices;
    var indicesAccessor = gltf.accessors[indicesId];
    var indices = readAccessor(gltf, indicesAccessor);
    var primitiveType = primitive.mode;

    var geometry = new Geometry({
        attributes : geometryAttributes,
        indices : new Uint32Array(indices.data),
        primitiveType : primitiveType
    });
    
    return geometry;
}
