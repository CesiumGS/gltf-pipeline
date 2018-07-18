'use strict';
var Cesium = require('cesium');

var byteLengthForComponentType = require('./byteLengthForComponentType');
var findAccessorMinMax = require('./findAccessorMinMax');
var getUniqueId = require('./getUniqueId');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var writeBufferComponent = require('./writeBufferComponent');

var DeveloperError = Cesium.DeveloperError;
var defined = Cesium.defined;

module.exports = createAccessor;

/**
 * Creates an accessor from data and adds it to the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Array.<Number>|Number} dataOrLength The data to store in the accessor buffer or the length of data to allocate.
 * @param {String} type glTF type (e.g. 'scalar', 'vec3')
 * @param {Number} componentType glTF component type (e.g. 5126 (float))
 * @param {Number} target glTF bufferView target (e.g. 34962 (ARRAY_BUFFER), 34963 (ELEMENT_ARRAY_BUFFER)
 * @param {String} [id] The id to use when assigning the accessor to the glTF asset. If undefined, a unique id is generated.
 *
 * @returns {String} The accessor's id.
 */
function createAccessor(gltf, dataOrLength, type, componentType, target, id) {
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
    if (!defined(id)) {
        id = getUniqueId(gltf, 'accessor');
    }
    var bufferViewId = getUniqueId(gltf, 'bufferView');
    var bufferId = getUniqueId(gltf, 'buffer');
    var bufferData = Buffer.allocUnsafe(dataLength * componentByteLength);
    if (defined(data)) {
        for (var i = 0; i < data.length; i++) {
            writeBufferComponent(bufferData, componentType, data[i], i * componentByteLength);
        }
    }
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
    gltf.accessors[id] = accessor;

    var bufferView = {
        buffer : bufferId,
        byteLength : bufferData.length,
        byteOffset : 0,
        extras : {
            _pipeline : {}
        },
        target : target
    };
    gltf.bufferViews[bufferViewId] = bufferView;

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
    gltf.buffers[bufferId] = buffer;

    var minMax = findAccessorMinMax(gltf, accessor);
    accessor.min = minMax.min;
    accessor.max = minMax.max;
    return id;
}
