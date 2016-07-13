'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var WebGLConstants = Cesium.WebGLConstants;

var mergeDuplicateAccessors = require('../../lib/mergeDuplicateAccessors');

describe('mergeDuplicateAccessors', function() {
    var testGltf = {
        accessors: {
            accessorA: {
                bufferView: 'bufferView',
                byteOffset: 0,
                byteStride: 0,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            },
            accessorB: {
                bufferView: 'bufferView',
                byteOffset: 3,
                byteStride: 0,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            }
        },
        bufferViews: {
            bufferView: {
                buffer: 'buffer',
                byteOffset: 0
            }
        },
        buffers: {
            buffer: {
                type: 'arraybuffer',
                extras : {
                    _pipeline : {}
                }
            }
        },
        meshes: {
            meshA: {
                primitives : [
                    {
                        attributes: {
                            TEST: 'accessorA'
                        }
                    }
                ]
            },
            meshB: {
                primitives : [
                    {
                        attributes: {
                            TEST: 'accessorB'
                        }
                    }
                ]
            }
        }
    };
    it('merges a single duplicate accessor', function () {
        var buffer = new Buffer([1, 2, 3, 1, 2, 3]);
        var gltf = clone(testGltf);
        var gltfBuffer = gltf.buffers.buffer;
        gltfBuffer.extras._pipeline.source = buffer;
        gltfBuffer.byteLength = buffer.length;
        gltf.bufferViews.bufferView.byteLength = buffer.length;
        mergeDuplicateAccessors(gltf);
        expect(Object.keys(gltf.accessors).length).toEqual(1);
        expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
    });

    it ('merges multiple duplicate accessors', function () {
        var buffer = new Buffer([1, 2, 3, 1, 2, 3, 1, 2, 3]);
        var gltf = clone(testGltf);
        var gltfBuffer = gltf.buffers.buffer;
        gltfBuffer.extras._pipeline.source = buffer;
        gltfBuffer.byteLength = buffer.length;
        gltf.bufferViews.bufferView.byteLength = buffer.length;
        gltf.accessors.accessorC = {
            bufferView: 'bufferView',
            byteOffset: 6,
            byteStride: 0,
            componentType: WebGLConstants.BYTE,
            count: 3,
            type: 'SCALAR'
        };
        gltf.meshes.meshC = {
            primitives : [
                {
                    attributes : {
                        TEST: 'accessorC'
                    }
                }
            ]
        };
        mergeDuplicateAccessors(gltf);
        expect(Object.keys(gltf.accessors).length).toEqual(1);
        expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
        expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshC.primitives[0].attributes.TEST);
    });

    it ('leaves a non-duplicate accessor alone', function () {
        var buffer = new Buffer([1, 2, 3, 1, 2, 3, 3, 2, 1]);
        var gltf = clone(testGltf);
        var gltfBuffer = gltf.buffers.buffer;
        gltfBuffer.extras._pipeline.source = buffer;
        gltfBuffer.byteLength = buffer.length;
        gltf.bufferViews.bufferView.byteLength = buffer.length;
        gltf.accessors.accessorC = {
            bufferView: 'bufferView',
            byteOffset: 6,
            byteStride: 0,
            componentType: WebGLConstants.BYTE,
            count: 3,
            type: 'SCALAR'
        };
        gltf.meshes.meshC = {
            primitives : [
                {
                    attributes : {
                        TEST: 'accessorC'
                    }
                }
            ]

        };
        mergeDuplicateAccessors(gltf);
        expect(Object.keys(gltf.accessors).length).toEqual(2);
        expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
        expect(gltf.meshes.meshA.primitives[0].attributes.TEST).not.toEqual(gltf.meshes.meshC.primitives[0].attributes.TEST);
    });
});