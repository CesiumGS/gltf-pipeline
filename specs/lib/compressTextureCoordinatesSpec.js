'use strict';
var Cesium = require('cesium');
var compressTextureCoordinates = require('../../lib/compressTextureCoordinates');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var WebGLConstants = Cesium.WebGLConstants;

describe('compressTextureCoordinates', function() {
    it('compresses texture coordinates', function() {
        var texCoords = new Float32Array([1.0, 0.0,
                                         0.0, 1.0,
                                         0.5, 0.5]);
        var texCoordBuffer = Buffer.from(texCoords.buffer.slice(0));
        var gltf = {
            accessors : [
                {
                    byteOffset : 0,
                    bufferView : 0,
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
            ],
            buffers : [
                {
                    byteLength : texCoordBuffer.length,
                    extras : {
                        _pipeline : {
                            source : texCoordBuffer
                        }
                    }
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : texCoordBuffer.length,
                    byteOffset : 0
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                TEXCOORD_0 : 0
                            },
                            material : 0
                        }
                    ]
                }
            ],
            materials : [
                {
                    technique : 0
                }
            ],
            techniques : [
                {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 0
                }
            ],
            programs : [
                {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 0
                }
            ],
            shaders : [
                {
                    type : WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                }
            ]
        };
        compressTextureCoordinates(gltf);
        uninterleaveAndPackBuffers(gltf);
        var texCoordAccessor = gltf.accessors[0];
        expect(texCoordAccessor.componentType).toEqual(WebGLConstants.FLOAT);
        expect(texCoordAccessor.type).toEqual('SCALAR');

        var technique = gltf.techniques[0];
        expect(technique.parameters.texcoord.type).toEqual(WebGLConstants.FLOAT);

        var buffer = gltf.buffers[0];
        var encodedBuffer = buffer.extras._pipeline.source;
        expect(encodedBuffer.length).toEqual(12);
        expect(encodedBuffer.length).toEqual(buffer.byteLength);

        var vs = gltf.shaders[0].extras._pipeline.source;
        expect(typeof vs).toEqual('string');

        var texCoord = new Cartesian2();
        for (var i = 0; i < texCoordAccessor.count; i++) {
            var encoded = encodedBuffer.readFloatLE(i * 4);
            AttributeCompression.decompressTextureCoordinates(encoded, texCoord);
            expect(texCoord.x).toBeCloseTo(texCoords[i * 2]);
            expect(texCoord.y).toBeCloseTo(texCoords[i * 2 + 1]);
        }
    });

    it('should only patch a program whos shader has not been patched yet', function() {
        var texCoords = new Float32Array([
            1.0, 0.0,
            0.0, 1.0,
            0.5, 0.5,
            1.0, 0.0,
            0.0, 1.0,
            0.5, 0.5,
            1.0, 0.0,
            0.0, 1.0,
            0.5, 0.5
        ]);
        var texCoordBuffer = Buffer.from(texCoords.buffer.slice(0));
        var gltf = {
            accessors : [
                {
                    byteOffset : 0,
                    bufferView : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0
                    ],
                    type : 'VEC2'
                }, {
                    byteOffset : 0,
                    bufferView : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0
                    ],
                    type : 'VEC2'
                }, {
                    byteOffset : 0,
                    bufferView : 0,
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
            ],
            buffers : [
                {
                    byteLength : texCoordBuffer.length,
                    extras : {
                        _pipeline : {
                            source : texCoordBuffer
                        }
                    }
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : texCoordBuffer.length,
                    byteOffset : 0
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                TEXCOORD_0 : 0
                            },
                            material : 0
                        }, {
                            attributes : {
                                TEXCOORD_0 : 1
                            },
                            material : 1
                        }, {
                            attributes : {
                                TEXCOORD_0 : 2
                            },
                            material : 2
                        }
                    ]
                }
            ],
            materials : [
                {
                    technique : 0
                }, {
                    technique : 1
                }, {
                    technique : 2
                }
            ],
            techniques : [
                {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 0
                }, {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 1
                }, {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 2
                }
            ],
            programs : [
                {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 0
                }, {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 1
                }, {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 0
                }
            ],
            shaders : [
                {
                    type: WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                }, {
                    type: WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                }
            ]
        };
        spyOn(Cesium.ShaderSource, 'replaceMain');
        compressTextureCoordinates(gltf);
        expect(Cesium.ShaderSource.replaceMain).toHaveBeenCalledTimes(2);
    });
});