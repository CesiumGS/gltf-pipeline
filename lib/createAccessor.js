'use strict';
var Cesium = require('cesium');
var addToArray = require('./addToArray');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var writeBufferComponent = require('./writeBufferComponent');

var DeveloperError = Cesium.DeveloperError;
var defined = Cesium.defined;

module.exports = createAccessor;

/**
 * Creates an accessor from data and adds it to the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Number[]|Number} dataOrLength The data to store in the accessor buffer or the length of data to allocate.
 * @param {String} type glTF type (e.g. 'scalar', 'vec3')
 * @param {Number} componentType glTF component type (e.g. 5126 (float))
 * @param {Number} target glTF bufferView target (e.g. 34962 (ARRAY_BUFFER), 34963 (ELEMENT_ARRAY_BUFFER)
 *
 * @returns {String} The accessor's id.
 */
function createAccessor(gltf, dataOrLength, type, componentType, target) {
    var numberOfComponents = numberOfComponentsForType(type);
    var data;
    var dataLength;
    if (Array.isArray(dataOrLength)) {
        data = dataOrLength;
        dataLength = data.length;
    } else {
        dataLength = dataOrLength;
    }
    if (dataLength % numberOfComponents !== 0) {
        throw new DeveloperError('Length of data written must be a multiple of the number of accessor components.');
    }
    var componentByteLength = byteLengthForComponentType(componentType);
    var bufferData = new Buffer(dataLength * componentByteLength);
    if (defined(data)) {
        for (var i = 0; i < data.length; i++) {
            writeBufferComponent(bufferData, componentType, data[i], i * componentByteLength);
        }
    }

    var buffer = {
    type : "arraybuffer",
    byteLength : bufferData.length,
        extras : {
            _pipeline : {
                extension : '.bin',
                source : bufferData
            }
        }
    };
    var bufferId = addToArray(gltf.buffers, buffer);

    var bufferView = {
        buffer : bufferId,
        byteLength : bufferData.length,
        byteOffset : 0,
        extras : {
            _pipeline : {}
        },
        target : target
    };
    var bufferViewId = addToArray(gltf.bufferViews, bufferView);

    var accessor = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : componentType,
        count : dataLength / numberOfComponents,
        extras : {
            _pipeline : {}
        },
        type : type
    };
    var accessorId = addToArray(gltf.accessors, accessor);

    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;
    return accessorId;
}