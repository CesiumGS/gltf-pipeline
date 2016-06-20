'use strict';
var Cesium = require('cesium');
var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var WebGLConstants = Cesium.WebGLConstants;
var compressTextureCoordinates = require('../../lib/compressTextureCoordinates');

describe('compressTextureCoordinates', function() {
    it('compresses texture coordinates', function() {
        var texCoords = new Float32Array([1.0, 0.0,
                                         0.0, 1.0,
                                         0.5, 0.5]);
        var texCoordBuffer = new Buffer(texCoords.buffer.slice(0));
        var gltf = {
            accessors : {
                texCoordAccessor : {
                    byteOffset : 0,
                    byteStride : 0,
                    bufferView : 'bufferView',
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0
                    ],
                    type : 'VEC2'
                }
            },
            buffers : {
                buffer : {
                    byteLength : texCoordBuffer.length,
                    extras : {
                        _pipeline : {
                            source : texCoordBuffer
                        }
                    }
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : texCoordBuffer.length,
                    byteOffset : 0
                }
            },
            meshes : {
                mesh : {
                    primitives : [
                        {
                            attributes : {
                                TEXCOORD_0 : 'texCoordAccessor'
                            },
                            material : 'material'
                        }
                    ]
                }
            },
            materials : {
                material : {
                    technique : 'technique'
                }
            },
            techniques : {
                technique : {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 'program'
                }
            },
            programs : {
                program : {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 'VS'
                }
            },
            shaders : {
                VS : {
                    type: WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : new Buffer('')
                        }
                    }
                }
            }
        };
        compressTextureCoordinates(gltf);
        var texCoordAccessor = gltf.accessors.texCoordAccessor;
        expect(texCoordAccessor.componentType).toEqual(WebGLConstants.FLOAT);
        expect(texCoordAccessor.type).toEqual('SCALAR');

        var technique = gltf.techniques.technique;
        expect(technique.parameters.texcoord.type).toEqual(WebGLConstants.FLOAT);

        var buffer = gltf.buffers.buffer;
        var encodedBuffer = buffer.extras._pipeline.source;
        expect(encodedBuffer.length).toEqual(12);
        expect(encodedBuffer.length).toEqual(buffer.byteLength);

        var texCoord = new Cartesian2();
        for (var i = 0; i < texCoordAccessor.count; i++) {
            var encoded = encodedBuffer.readFloatLE(i*4);
            AttributeCompression.decompressTextureCoordinates(encoded, texCoord);
            expect(texCoord.x).toBeCloseTo(texCoords[i*2]);
            expect(texCoord.y).toBeCloseTo(texCoords[i*2 + 1]);
        }
    });
});