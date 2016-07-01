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
var Matrix2 = Cesium.Matrix2;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var defined = Cesium.defined;

module.exports = gltfPrimitiveToCesiumGeometry;

// Helper method for packing Cartesians to arrays
function packArray(values) {
    var length = values.data.length;
    var packFunction;
    var packedLength;
    switch (values.type) {
        case 'number':
            return values.data;
        case 'Cartesian2':
            packedLength = Cartesian2.packedLength;
            packFunction = Cartesian2.pack;
            break;
        case 'Cartesian3':
            packedLength = Cartesian3.packedLength;
            packFunction = Cartesian3.pack;
            break;
        case 'Cartesian4':
            packedLength = Cartesian4.packedLength;
            packFunction = Cartesian4.pack;
            break;
        case 'Matrix2':
            packedLength = Matrix2.packedLength;
            packFunction = Matrix2.pack;
            break;
        case 'Matrix3':
            packedLength = Matrix3.packedLength;
            packFunction = Matrix3.pack;
            break;
        case 'Matrix4':
            packedLength = Matrix4.packedLength;
            packFunction = Matrix4.pack;
            break;
    }
    var packed = new Array(length * packedLength);
    for (var i = 0; i < length; ++i) {
        packFunction(values.data[i], packed, i * packedLength);
    }
    return packed;
}

// Helper method for taking a gltf primitive attribute and returning a geometry attribute
function mapPrimitiveAttributeToGeometry(gltf, primitive, semantic, geometryAttributes) {
    var accessorId = primitive.attributes[semantic];
    var accessor = gltf.accessors[accessorId];
    var componentsPerAttribute = numberOfComponentsForType(accessor.type);
    var values = readAccessor(gltf, accessor);
    var packed = packArray(values);

    var attributeName;
    var finalValues;
    // Strip semantic of its index
    switch(semantic.replace(/([0-9]|_)/g, '')) {
        case 'POSITION':
            // Only use geometry semantic for one attribute, otherwise just create a generic attribute
            if (!defined(geometryAttributes.position)) {
                attributeName = 'position';
                finalValues = new Float64Array(packed);
            } else {
                attributeName = semantic;
                finalValues = new Float64Array(packed);
            }
            break;
        case 'NORMAL':
            if (!defined(geometryAttributes.normal)) {
                attributeName = 'normal';
                finalValues = new Float32Array(packed);
            } else {
                attributeName = semantic;
                finalValues = new Float32Array(packed);
            }
            break;
        case 'TEXCOORD':
            if (!defined(geometryAttributes.st)) {
                attributeName = 'st';
                finalValues = new Float32Array(packed);
            } else {
                attributeName = semantic;
                finalValues = new Float32Array(packed);
            }
            break;
        default:
            attributeName = semantic;
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
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
            var nameAndAttribute = mapPrimitiveAttributeToGeometry(gltf, primitive, semantic, geometryAttributes);
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
