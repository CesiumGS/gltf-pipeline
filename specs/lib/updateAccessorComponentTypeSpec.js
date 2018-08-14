'use strict';
var Cesium = require('cesium');
var readResources = require('../../lib/readResources');
var updateAccessorComponentTypes = require('../../lib/updateAccessorComponentTypes');

var WebGLConstants = Cesium.WebGLConstants;

var buffer;

describe('updateAccessorComponentTypes', function() {
    beforeAll(function() {
        var source = Buffer.from((new Float32Array([-2.0, 1.0, 0.0, 1.0, 2.0, 3.0])).buffer);
        var byteLength = source.length;
        var dataUri = 'data:application/octet-stream;base64,' + source.toString('base64');
        buffer = {
            uri: dataUri,
            byteLength: byteLength
        };
    });

    it('converts joints accessor types', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {
                            attributes: {
                                JOINTS_0: 0
                            }
                        }, {
                            attributes: {
                                JOINTS_0: 1
                            }
                        }, {
                            attributes: {
                                JOINTS_0: 2
                            }
                        }
                    ]
                }
            ],
            accessors: [
                {
                    bufferView: 0,
                    componentType: WebGLConstants.BYTE,
                    count: 24,
                    type: 'VEC4'
                }, {
                    bufferView: 1,
                    componentType: WebGLConstants.FLOAT,
                    count: 24,
                    type: 'VEC4'
                }, {
                    bufferView: 2,
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    count: 24,
                    type: 'VEC4'
                }
            ],
            bufferViews: [
                {
                    buffer: 0,
                    byteLength: 12
                }, {
                    buffer: 0,
                    byteOffset: 12,
                    byteLength: 12
                }, {
                    buffer: 0,
                    byteLength: 12
                }
            ],
            buffers: [buffer]
        };

        return readResources(gltf).then(function(gltf) {
            updateAccessorComponentTypes(gltf);

            expect(gltf.accessors.length).toBe(3);
            expect(gltf.bufferViews.length).toBe(5);
            expect(gltf.buffers.length).toBe(3);

            expect(gltf.accessors[0].componentType).toBe(WebGLConstants.UNSIGNED_BYTE);
            expect(gltf.accessors[0].bufferView).toBe(3);
            expect(gltf.bufferViews[3].buffer).toBe(1);
            expect(gltf.bufferViews[3].byteLength).toBe(96);

            expect(gltf.accessors[1].componentType).toBe(WebGLConstants.UNSIGNED_SHORT);
            expect(gltf.accessors[1].bufferView).toBe(4);
            expect(gltf.bufferViews[4].buffer).toBe(2);
            expect(gltf.bufferViews[4].byteLength).toBe(192);

            expect(gltf.accessors[2].componentType).toBe(WebGLConstants.UNSIGNED_SHORT);
            expect(gltf.accessors[2].bufferView).toBe(2);
        });
    });

    it('converts weights accessor types', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {
                            attributes: {
                                WEIGHTS_0: 0
                            }
                        }, {
                            attributes: {
                                WEIGHTS_0: 1
                            }
                        }, {
                            attributes: {
                                WEIGHTS_0: 2
                            }
                        }
                    ]
                }
            ],
            accessors: [
                {
                    bufferView: 0,
                    componentType: WebGLConstants.FLOAT,
                    count: 24,
                    type: 'VEC4'
                }, {
                    bufferView: 1,
                    componentType: WebGLConstants.BYTE,
                    count: 24,
                    type: 'VEC4'
                }, {
                    bufferView: 2,
                    componentType: WebGLConstants.SHORT,
                    count: 24,
                    type: 'VEC4'
                }
            ],
            bufferViews: [
                {
                    buffer: 0,
                    byteLength: 12
                }, {
                    buffer: 0,
                    byteOffset: 12,
                    byteLength: 12
                }, {
                    buffer: 0,
                    byteLength: 12
                }
            ],
            buffers: [buffer]
        };

        return readResources(gltf).then(function(gltf) {
            updateAccessorComponentTypes(gltf);

            expect(gltf.accessors.length).toBe(3);
            expect(gltf.bufferViews.length).toBe(5);
            expect(gltf.buffers.length).toBe(3);

            expect(gltf.accessors[0].componentType).toBe(WebGLConstants.FLOAT);
            expect(gltf.accessors[0].bufferView).toBe(0);

            expect(gltf.accessors[1].componentType).toBe(WebGLConstants.UNSIGNED_BYTE);
            expect(gltf.accessors[1].bufferView).toBe(3);
            expect(gltf.bufferViews[3].buffer).toBe(1);
            expect(gltf.bufferViews[3].byteLength).toBe(96);

            expect(gltf.accessors[2].componentType).toBe(WebGLConstants.UNSIGNED_SHORT);
            expect(gltf.accessors[2].bufferView).toBe(4);
            expect(gltf.bufferViews[4].buffer).toBe(2);
            expect(gltf.bufferViews[4].byteLength).toBe(192);
        });
    });
});
