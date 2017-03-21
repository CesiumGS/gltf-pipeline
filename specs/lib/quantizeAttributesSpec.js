'use strict';
var clone = require('clone');
var byteLengthForComponentType = require('../../lib/byteLengthForComponentType');
var numberOfComponentsForType = require('../../lib/numberOfComponentsForType');
var quantizeAttributes = require('../../lib/quantizeAttributes');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

describe('quantizeAttributes', function() {
    var buffer = new Buffer(new Uint8Array(120));
    var testGltf = {
        accessors : [
            {
                // Interleaved accessors in bufferView_0
                bufferView : 0,
                byteOffset : 0,
                byteStride : 18,
                componentType : 5126,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC3'
            }, {
                bufferView : 0,
                byteOffset : 12,
                byteStride : 18,
                componentType : 5123,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC2'
            }, {
                // Block accessors in bufferView_1
                bufferView : 1,
                byteOffset : 0,
                byteStride : 12,
                componentType : 5126,
                count : 3,
                min : [-1.0, -1.0, -1.0],
                max : [1.0, 1.0, 1.0],
                type : 'VEC3'
            }, {
                // Already quantized
                bufferView : 1,
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
            }, {
                // SCALAR attribute
                bufferView : 1,
                byteOffset : 60,
                componentType : 5126,
                count : 3,
                min : [0],
                max : [1],
                type : 'SCALAR'
            }, {
            // floating-point rounding test
                bufferView : 2,
                byteOffset : 0,
                componentType : 5126,
                count : 1,
                min : [-82.39035034179688],
                max : [0.0026710000820457935],
                type : 'SCALAR'
            }
        ],
        bufferViews : [
            {
                buffer : 0,
                byteLength : 48,
                byteOffset : 0,
                target : 34962
            },
            {
                buffer : 0,
                byteLength : 72,
                byteOffset : 48,
                target : 34962
            },
            {
                buffer : 1,
                byteLength : 4,
                byteOffset : 0,
                target: 34962
            }
        ],
        buffers : [
            {
                byteLength : buffer.length,
                extras : {
                    _pipeline : {}
                }
            },
            {
                byteLength : 4,
                extras : {
                    _pipeline : {
                        source : new Buffer(new Float32Array([0.0026710000820457935]).buffer)
                    }
                }
            }
        ],
        meshes : [
            {
                primitives : [
                    {
                        attributes : {
                            POSITION : 0,
                            NORMAL : 1
                        }
                    },
                    {
                        attributes : {
                            POSITION : 2,
                            TEXCOORD : 3,
                            SCALAR_TEST : 4
                        }
                    },
                    {
                        attributes : {
                            FLOAT_TEST : 5
                        }
                    }
                ]
            }
        ]
    };

    it('Doesn\'t quantize if options.semantics is empty', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: []});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(buffer.length + 4);
    });

    it('Doesn\'t quantize excluded semantics', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {exclude: ['POSITION', 'NORMAL', 'TEXCOORD', 'SCALAR_TEST', 'FLOAT_TEST']});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(buffer.length + 4);
    });

    it('Quantizes attributes for semantic', function() {
        var gltf = clone(testGltf);
        var accessor_0 = gltf.accessors[0];
        var accessor_2 = gltf.accessors[2];
        var size = byteLengthForComponentType(accessor_0.componentType) * numberOfComponentsForType(accessor_0.type) * accessor_0.count;
        size += byteLengthForComponentType(accessor_2.componentType) * numberOfComponentsForType(accessor_2.type) * accessor_2.count;
        size = size/2.0;
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['POSITION']});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(buffer.length + 4);
        var decodeMatrix = accessor_0.extensions.WEB3D_quantized_attributes.decodeMatrix;
        expect(decodeMatrix[0]).toBe(2.0 / 65535.0);
    });

    it('Quantizes attributes using options.normalized for higher precision decode', function() {
        var gltf = clone(testGltf);
        var accessor_0 = gltf.accessors[0];
        var accessor_2 = gltf.accessors[2];
        var size = byteLengthForComponentType(accessor_0.componentType) * numberOfComponentsForType(accessor_0.type) * accessor_0.count;
        size += byteLengthForComponentType(accessor_2.componentType) * numberOfComponentsForType(accessor_2.type) * accessor_2.count;
        size = size/2.0;
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {
            semantics : ['POSITION'],
            normalized : true
        });
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(buffer.length + 4);
        expect(accessor_0.normalized).toBeTruthy();
        expect(accessor_2.normalized).toBeTruthy();
        var decodeMatrix = accessor_0.extensions.WEB3D_quantized_attributes.decodeMatrix;
        expect(decodeMatrix[0]).toBe(2.0);
    });

    it('Reduces the decimal places in decode matrix using options.precision', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        var precision = 6;
        quantizeAttributes(gltf, {precision: precision});
        var matrixEntry = '' + gltf.accessors[0].extensions.WEB3D_quantized_attributes.decodeMatrix[0];
        var calculatedPrecision = matrixEntry.substring(matrixEntry.indexOf('.')).length;
        expect(precision).toEqual(calculatedPrecision);
    });

    it('Doesn\'t quantize non-float attribute', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['NORMAL']});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(buffer.length + 4);
    });

    it('Doesn\'t quantize already quantized attribute', function() {
        var gltf = clone(testGltf);
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['TEXCOORD']});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength).toEqual(buffer.length + 4);
    });

    it('Quantizes scalar attribute', function() {
        var gltf = clone(testGltf);
        var accessor_4 = gltf.accessors[4];
        var size = byteLengthForComponentType(accessor_4.componentType) * numberOfComponentsForType(accessor_4.type) * accessor_4.count;
        size = size/2.0;
        gltf.buffers[0].extras._pipeline.source = buffer;
        quantizeAttributes(gltf, {semantics: ['SCALAR_TEST']});
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.buffers[0].byteLength + size).toEqual(buffer.length + 4);
    });
});