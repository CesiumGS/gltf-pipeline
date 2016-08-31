'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var AccessorReader = require('../../lib/AccessorReader');
var changeAccessorComponentType = require('../../lib/changeAccessorComponentType');

describe('changeAccessorComponentType', function() {
    it('does nothing if the accessor is already the target componentType', function() {
        var gltf = {
            accessors : {
                accessor : {
                    componentType: WebGLConstants.FLOAT
                }
            }
        };
        var accessor = gltf.accessors.accessor;
        changeAccessorComponentType(gltf, accessor, WebGLConstants.FLOAT);
        expect(accessor.componentType).toBe(WebGLConstants.FLOAT);
    });

    it('overwrites the existing data if the target component type is smaller', function() {
        var data = new Uint16Array([0, 1, 2, 3, 4, 5]);
        var dataBuffer = new Buffer(data.buffer);
        var gltf = {
            accessors : {
                accessor : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : data.length,
                    type : "SCALAR"
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : dataBuffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength: dataBuffer.length,
                    extras: {
                        _pipeline: {
                            source: dataBuffer
                        }
                    }
                }
            }
        };
        var accessor = gltf.accessors.accessor;
        changeAccessorComponentType(gltf, accessor, WebGLConstants.UNSIGNED_BYTE);
        expect(accessor.componentType).toBe(WebGLConstants.UNSIGNED_BYTE);
        expect(Object.keys(gltf.buffers).length).toBe(1);
        var accessorReader = new AccessorReader(gltf, accessor);
        var components = [];
        while(accessorReader.hasNext()) {
            accessorReader.read(components);
            expect(components[0]).toBe(accessorReader.index);
            accessorReader.next();
        }
    });

    it('overwrites the existing data if the target component type is the same size', function() {
        var data = new Float32Array([0, 1, 2, 3, 4, 5]);
        var dataBuffer = new Buffer(data.buffer);
        var gltf = {
            accessors : {
                accessor : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : data.length,
                    type : "SCALAR"
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : dataBuffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength: dataBuffer.length,
                    extras: {
                        _pipeline: {
                            source: dataBuffer
                        }
                    }
                }
            }
        };
        var accessor = gltf.accessors.accessor;
        changeAccessorComponentType(gltf, accessor, WebGLConstants.UNSIGNED_INT);
        expect(accessor.componentType).toBe(WebGLConstants.UNSIGNED_INT);
        expect(Object.keys(gltf.buffers).length).toBe(1);
        var accessorReader = new AccessorReader(gltf, accessor);
        var components = [];
        while(accessorReader.hasNext()) {
            accessorReader.read(components);
            expect(components[0]).toBe(accessorReader.index);
            accessorReader.next();
        }
    });

    it('creates a new buffer if the target component type is larger', function() {
        var data = new Uint16Array([0, 1, 2, 3, 4, 5]);
        var dataBuffer = new Buffer(data.buffer);
        var gltf = {
            accessors : {
                accessor : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : data.length,
                    type : "SCALAR"
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : dataBuffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength: dataBuffer.length,
                    extras: {
                        _pipeline: {
                            source: dataBuffer
                        }
                    }
                }
            }
        };
        var accessor = gltf.accessors.accessor;
        changeAccessorComponentType(gltf, accessor, WebGLConstants.UNSIGNED_INT);
        expect(accessor.componentType).toBe(WebGLConstants.UNSIGNED_INT);
        expect(Object.keys(gltf.buffers).length).toBe(2);
        var accessorReader = new AccessorReader(gltf, accessor);
        var components = [];
        while(accessorReader.hasNext()) {
            accessorReader.read(components);
            expect(components[0]).toBe(accessorReader.index);
            accessorReader.next();
        }
    });
});