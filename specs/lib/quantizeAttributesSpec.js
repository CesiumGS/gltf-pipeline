'use strict';
var clone = require('clone');

var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var quantizeAttributes = require('../../lib/quantizeAttributes');

describe('quantizeAttributes', function() {
    var buffer = new Buffer(new Uint8Array(120));
    var testGltf = {
        accessors : {
            // Interleaved accessors in bufferView_0
            accessor_0 : {
                bufferView : 'bufferView_0',
                byteOffset : 0,
                byteStride : 18,
                componentType : 5126,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC3',
            },
            accessor_1 : {
                bufferView : 'bufferView_0',
                byteOffset : 12,
                byteStride : 18,
                componentType : 5123,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC2'
            },
            // Block accessors in bufferView_1
            accessor_2 : {
                bufferView : 'bufferView_1',
                byteOffset : 0,
                byteStride : 12,
                componentType : 5126,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC3'
            },
            // Already quantized
            accessor_3 : {
                bufferView : 'bufferView_1',
                byteOffset : 36,
                componentType : 5126,
                count : 3,
                min : [0, 0],
                max : [65535, 65535],
                type : 'VEC2',
                extensions : {
                    WEB3D_quantized_attributes : {
                        decodeMatrix : [
                            1.0, 0.0, 0.0,
                            0.0, 1.0, 0.0,
                            0.0, 0.0, 1.0
                        ],
                        decodeMin : [-1.0, -1.0],
                        decodeMax : [1.0, 1.0]
                    }
                }
            },
            // SCALAR attribute
            accessor_4 : {
                bufferView : 'bufferView_1',
                byteOffset : 60,
                componentType : 5126,
                count : 3,
                min : [0],
                max : [1],
                type : 'SCALAR'
            }
        },
        bufferViews : {
            bufferView_0 : {
                buffer : 'buffer',
                byteLength : 48,
                byteOffset : 0,
                target : 34962
            },
            bufferView_1 : {
                buffer : 'buffer',
                byteLength : 72,
                byteOffset : 48,
                target : 34962
            }
        },
        buffers : {
            buffer : {
                byteLength : buffer.length,
                type : 'arraybuffer',
                extras : {
                    _pipeline : {}
                }
            }
        },
        meshes : {
            mesh : {
                primitives : [
                    {
                        attributes : {
                            POSITION : 'accessor_0',
                            NORMAL : 'accessor_1'
                        }
                    },
                    {
                        attributes : {
                            POSITION : 'accessor_2',
                            TEXCOORD : 'accessor_3',
                            SCALAR_TEST : 'accessor_4'
                        }
                    }
                ]
            }
        }
    };

    it('Doesn\'t quantize if options.semantics is empty', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: []});
        expect(gltf.buffers.buffer.byteLength).toEqual(buffer.length);
    });

    it('Doesn\'t quantize excluded semantics', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {exclude: ['POSITION', 'NORMAL', 'TEXCOORD', 'SCALAR_TEST']});
        expect(gltf.buffers.buffer.byteLength).toEqual(buffer.length);
    });

    it('Quantizes attributes for semantic', function() {
        var gltf = clone(testGltf);
        var accessor_0 = gltf.accessors.accessor_0;
        var accessor_2 = gltf.accessors.accessor_2;
        var size = byteLengthForComponentType(accessor_0.componentType) * numberOfComponentsForType(accessor_0.type) * accessor_0.count;
        size += byteLengthForComponentType(accessor_2.componentType) * numberOfComponentsForType(accessor_2.type) * accessor_2.count;
        size = size/2.0;
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['POSITION']});
        expect(gltf.buffers.buffer.byteLength + size).toEqual(buffer.length);
    });

    it('Reduces the decimal places in decode matrix using options.precision', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        var precision = 6;
        quantizeAttributes(gltf, {precision: precision});
        var matrixEntry = '' + gltf.accessors.accessor_0.extensions.WEB3D_quantized_attributes.decodeMatrix[0];
        var calculatedPrecision = matrixEntry.substring(matrixEntry.indexOf('.')).length;
        expect(precision).toEqual(calculatedPrecision);
    });

    it('Doesn\'t quantize non-float attribute', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['NORMAL']});
        expect(gltf.buffers.buffer.byteLength).toEqual(buffer.length);
    });

    it('Doesn\'t quantize already quantized attribute', function() {
        var gltf = clone(testGltf);
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['TEXCOORD']});
        expect(gltf.buffers.buffer.byteLength).toEqual(buffer.length);
    });

    it('Quantizes scalar attribute', function() {
        var gltf = clone(testGltf);
        var accessor_4 = gltf.accessors.accessor_4;
        var size = byteLengthForComponentType(accessor_4.componentType) * numberOfComponentsForType(accessor_4.type) * accessor_4.count;
        size = size/2.0;
        gltf.buffers.buffer.extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['SCALAR_TEST']});
        expect(gltf.buffers.buffer.byteLength + size).toEqual(buffer.length);
    });
});