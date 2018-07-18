'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');

var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;

var AccessorReader = require('./AccessorReader');
var changeAccessorComponentType = require('./changeAccessorComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var getAccessorsForSemantic = require('./getAccessorsForSemantic');
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

/**
 * Searches for attribute accessors that contain only integer data that is stored
 * in either a floating-point data type, or an integer one with more precision
 * than necessary. The data is rewritten to the most optimal data type.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Options defining custom behavior.
 * @param {Array} [options.semantics] An array of semantics to compress.
 * @returns {Promise} A promise that resolves to the glTF asset with compressed integer accessors.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function compressIntegerAccessors(gltf, options) {
    options = defaultValue(options, {});
    var semantics = defaultValue(options.semantics, []);
    var semanticsLength = semantics.length;
    var promises = [];
    for (var i = 0; i < semanticsLength; i++) {
        var semantic = semantics[i];
        promises.push(getAccessorsForSemantic(gltf, semantic, compressIntegerAccessor));
    }
    return Promise.all(promises).then(function() {
        uninterLeaveAndPackBuffers(gltf);
        return gltf;
    });
}

function compressIntegerAccessor(gltf, primitive, accessorId, matchedSemantic) {
    /* These callback parameters are unused */
    void(primitive, matchedSemantic);

    var accessors = gltf.accessors;
    var accessor = accessors[accessorId];
    var accessorReader = new AccessorReader(gltf, accessor);
    var bufferView = accessorReader.bufferView;
    if (bufferView.target === WebGLConstants.ARRAY_BUFFER) {
        var newComponentType = canCompressAccessor(gltf, accessorReader);
        if (defined(newComponentType)) {
            changeAccessorComponentType(gltf, accessor, newComponentType);
        }
    }
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
        var components = [];
        while (defined(accessorReader.read(components))) {
            for (i = 0; i < numComponents; i++) {
                if (!isInt(components[i])) {
                    return undefined;
                }
            }
            accessorReader.next();
        }
    }
    return componentType;
}

function isInt(value) {
    var x = parseFloat(value);
    return (x | 0) === x;
}
