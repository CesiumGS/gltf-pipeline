'use strict';
var Cesium = require('cesium');
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

var AccessorReader = require('./AccessorReader');
var findAccessorMinMax = require('./findAccessorMinMax');
var uninterLeaveAndPackBuffers = require('./uninterleaveAndPackBuffers');

module.exports = compressIntegerAccessors;

var signedComponentTypes = [
    {
        componentType : WebGLConstants.BYTE,
        min : -128,
        max : 127
    },
    {
        componentType : WebGLConstants.SHORT,
        min : -32768,
        max : 32767
    }
];

var unsignedComponentTypes = [
    {
        componentType : WebGLConstants.UNSIGNED_BYTE,
        min : 0,
        max : 255
    },
    {
        componentType : WebGLConstants.UNSIGNED_SHORT,
        min : 0,
        max : 65535
    }
];

function compressIntegerAccessors(gltf) {
    var accessors = gltf.accessors;
    for (var accessorId in accessors) {
        if (accessors.hasOwnProperty(accessorId)) {
            if (accessorId === 'accessor_21') {
                continue;
            }
            var accessor = accessors[accessorId];
            var accessorReader = new AccessorReader(gltf, accessor);
            var newComponentType = canCompressAccessor(gltf, accessorReader);
            if (defined(newComponentType)) {
                accessorReader.reset();
                var value = accessorReader.read();
                while (defined(value)) {
                    accessorReader.write(value, newComponentType);
                    accessorReader.next();
                    value = accessorReader.read();
                }
                accessor.componentType = newComponentType;
            }
        }
    }
    uninterLeaveAndPackBuffers(gltf);
}

function canCompressAccessor(gltf, accessorReader) {
    // Can't compress something smaller than a byte
    if (accessorReader.componentType === WebGLConstants.BYTE ||
        accessorReader.componentType === WebGLConstants.UNSIGNED_BYTE) {
        return undefined;
    }
    // Do the checks based on the min and max first
    var minMax = findAccessorMinMax(gltf, accessorReader.accessor);
    var min = minMax.min;
    var max = minMax.max;
    var numComponents = min.length;
    var minValue = Number.POSITIVE_INFINITY;
    var maxValue = Number.NEGATIVE_INFINITY;
    var isSigned = false;
    var i;
    for (i = 0; i < numComponents; i++) {
        if (!isInt(min[i]) || !isInt(max[i])) {
            // If the min or max aren't integers, we know right away that this can't be compressed
            return undefined;
        }
        if (min[i] < 0 || max[i] < 0) {
            isSigned = true;
        }
        minValue = Math.min(minValue, min[i]);
        maxValue = Math.max(maxValue, max[i]);
    }
    // See if there is a small int component type that this range fits into
    var componentTypes = isSigned ? signedComponentTypes : unsignedComponentTypes;
    var numComponentTypes = componentTypes.length;
    // Component types are listed in ascending size order, so the first match can be taken
    var componentType;
    for (i = 0; i < numComponentTypes; i++) {
        var componentTypeInfo = componentTypes[i];
        var componentMin = componentTypeInfo.min;
        var componentMax = componentTypeInfo.max;
        if (minValue >= componentMin && maxValue <= componentMax) {
            componentType = componentTypeInfo.componentType;
            break;
        }
    }
    // No matches, or matched to the existing type
    if (!defined(componentType) || componentType === accessorReader.componentType) {
        return undefined;
    }
    // If the accessor was marked as a float before, make sure that there aren't any floating point values in the data
    if (accessorReader.componentType === WebGLConstants.FLOAT) {
        var value = accessorReader.read();
        while (defined(value)) {
            for (i = 0; i < numComponents; i++) {
                if (!isInt(value[i])) {
                    return undefined;
                }
            }
            accessorReader.next();
            value = accessorReader.read();
        }
    }
    return componentType;
}

function isInt(value) {
    var x = parseFloat(value);
    return (x | 0) === x;
}