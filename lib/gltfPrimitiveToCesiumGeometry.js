'use strict';
var readAccessor = require('./readAccessor');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var packArray = require('./packArray');
var Cesium = require('cesium');
var Geometry = Cesium.Geometry;
var GeometryAttribute = Cesium.GeometryAttribute;
var ComponentDatatype = Cesium.ComponentDatatype;
var defined = Cesium.defined;

module.exports = gltfPrimitiveToCesiumGeometry;

// Helper function for taking a gltf primitive attribute and returning a geometry attribute
function mapPrimitiveAttributeToGeometry(gltf, primitive, semantic, geometryAttributes) {
    var accessorId = primitive.attributes[semantic];
    var accessor = gltf.accessors[accessorId];
    var componentsPerAttribute = numberOfComponentsForType(accessor.type);
    var values = [];
    var type = readAccessor(gltf, accessor, values);

    var packed = packArray(values, type);

    var attributeName;
    var finalValues;

    if (semantic.indexOf('POSITION') === 0) {
        // Only use geometry semantic for one attribute, otherwise just create a generic attribute
        if (!defined(geometryAttributes.position)) {
            attributeName = 'position';
            finalValues = new Float64Array(packed);
        } else {
            attributeName = semantic;
            finalValues = new Float64Array(packed);
        }
    } else if (semantic.indexOf('NORMAL') === 0) {
        if (!defined(geometryAttributes.normal)) {
            attributeName = 'normal';
            finalValues = new Float32Array(packed);
        } else {
            attributeName = semantic;
            finalValues = new Float32Array(packed);
        }
    } else if (semantic.indexOf('TANGENT') === 0) {
        if (!defined(geometryAttributes.tangent)) {
            attributeName = 'tangent';
            finalValues = new Float32Array(packed);
        } else {
            attributeName = semantic;
            finalValues = new Float32Array(packed);
        }
    } else if (semantic.indexOf('BITANGENT') === 0) {
        if (!defined(geometryAttributes.bitangent)) {
            attributeName = 'bitangent';
            finalValues = new Float32Array(packed);
        } else {
            attributeName = semantic;
            finalValues = new Float32Array(packed);
        }
    } else if (semantic.indexOf('TEXCOORD') === 0) {
        if (!defined(geometryAttributes.st)) {
            attributeName = 'st';
            finalValues = new Float32Array(packed);
        } else {
            attributeName = semantic;
            finalValues = new Float32Array(packed);
        }
    } else {
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

/**
 * @private
 */
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
    var indices = [];
    readAccessor(gltf, indicesAccessor, indices);
    var primitiveType = primitive.mode;

    var geometry = new Geometry({
        attributes : geometryAttributes,
        indices : new Uint32Array(indices),
        primitiveType : primitiveType
    });

    return geometry;
}
