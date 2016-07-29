'use strict';
var Cesium = require('cesium');
var jp = require('jsonpath');
var _ = require('underscore');

var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;
var defined = Cesium.defined;

var getUniqueId = require('./getUniqueId');
var readAccessor = require('./readAccessor');

module.exports = combinePrimitives;

//Combines primitives in a mesh which have the same material, mode, and attributes.
function combinePrimitives(gltf) {
    combineUnindexedPrimitives(gltf);
    combinePrimitivesWithSharedAttributes(gltf);
}

function combineUnindexedPrimitives(gltf) {
    jp.apply(gltf, '$.meshes[*]', function(mesh) {
        var primitives = mesh.primitives;
        for (var i = 0; i < primitives.length; i++) {
            var primitive = primitives[i];
            if (!defined(primitive.indices)) {
                var attributes = {};
                for (var j = i + 1; j < primitives.length; j++) {
                }
            }
        }
        return mesh;
    });
}

function combinePrimitivesWithSharedAttributes(gltf) {
    var accessors = gltf.accessors;
    jp.apply(gltf, '$.meshes[*]', function(mesh) {
        var primitives = mesh.primitives;
        for (var i = 0; i < primitives.length; i++) {
            var primitive = primitives[i];
            if (defined(primitive.indices)) {
                var indices = [];
                var matches = [];
                for (var j = i + 1; j < primitives.length; j++) {
                    var comparePrimitive = primitives[j];
                    if (defined(comparePrimitive.indices) &&
                        _.isEqual(primitive.attributes, comparePrimitive.attributes) &&
                        primitive.material === comparePrimitive.material &&
                        primitive.mode === comparePrimitive.mode ) {
                        readAccessor(gltf, accessors[comparePrimitive.indices], indices);
                        matches.push(j);
                    }
                }
                var matchesLength = matches.length;
                if (matchesLength > 0) {
                    readAccessor(gltf, accessors[primitive.indices], indices);
                    var indexAccessorId = createIndexAccessor(gltf, indices);
                    primitive.indices = indexAccessorId;
                    for (var k = 0; k < matchesLength; k++) {
                        var match = matches[k] - k;
                        primitives.splice(match, 1);
                    }
                }
            }
        }
        return mesh;
    });
}

var accessorPrefix = 'indexAccessor';
var bufferViewPrefix = 'indexBufferView';
var bufferPrefix = 'indexBuffer';

function createIndexAccessor(gltf, indices) {
    var max = Math.max.apply(null, indices);
    if (max >= 65536) {
        throw new DeveloperError('Cannot merge primitives with indices higher than 2^16-1');
    }
    var min = Math.min.apply(null, indices);
    var indexBuffer = new Buffer(new Uint16Array(indices).buffer);

    var accessorId = getUniqueId(gltf, accessorPrefix);
    var bufferViewId = getUniqueId(gltf, bufferViewPrefix);
    var bufferId = getUniqueId(gltf, bufferPrefix);

    gltf.accessors[accessorId] = {
        bufferView : bufferViewId,
        byteOffset : 0,
        byteStride : 0,
        componentType : WebGLConstants.UNSIGNED_SHORT,
        count : indices.length,
        min : [min],
        max : [max],
        type : 'SCALAR'
    };
    gltf.bufferViews[bufferViewId] = {
        buffer : bufferId,
        byteLength : indexBuffer.length,
        byteOffset : 0,
        target : WebGLConstants.ELEMENT_ARRAY_BUFFER
    };
    gltf.buffers[bufferId] = {
        byteLength : indexBuffer.length,
        type : 'arraybuffer',
        extras : {
            _pipeline : {
                source : indexBuffer
            }
        }
    };
    return accessorId;
}