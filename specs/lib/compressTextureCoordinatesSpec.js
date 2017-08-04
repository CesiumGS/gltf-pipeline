'use strict';
var Cesium = require('cesium');
var compressTextureCoordinates = require('../../lib/compressTextureCoordinates');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var WebGLConstants = Cesium.WebGLConstants;

describe('compressTextureCoordinates', function() {
    it('compresses texture coordinates', function(done) {
        var texCoords = new Float32Array([1.0, 0.0,
                                         0.0, 1.0,
                                         0.5, 0.5]);
        var texCoordBuffer = Buffer.from(texCoords.buffer.slice(0));
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
                    type : WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                }
            }
        };
        compressTextureCoordinates(gltf).then(function() {
            var texCoordAccessor = gltf.accessors.texCoordAccessor;
            expect(texCoordAccessor.componentType).toEqual(WebGLConstants.FLOAT);
            expect(texCoordAccessor.type).toEqual('SCALAR');

            var technique = gltf.techniques.technique;
            expect(technique.parameters.texcoord.type).toEqual(WebGLConstants.FLOAT);

            var buffer = gltf.buffers.buffer;
            var encodedBuffer = buffer.extras._pipeline.source;
            expect(encodedBuffer.length).toEqual(12);
            expect(encodedBuffer.length).toEqual(buffer.byteLength);

            var vs = gltf.shaders.VS.extras._pipeline.source;
            expect(typeof vs).toEqual('string');

            var texCoord = new Cartesian2();
            for (var i = 0; i < texCoordAccessor.count; i++) {
                var encoded = encodedBuffer.readFloatLE(i * 4);
                AttributeCompression.decompressTextureCoordinates(encoded, texCoord);
                expect(texCoord.x).toBeCloseTo(texCoords[i * 2]);
                expect(texCoord.y).toBeCloseTo(texCoords[i * 2 + 1]);
            }
            done();
        });
    });

    it('should only patch a program whose shader has not been patched yet', function(done) {
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
            accessors : {
                texCoordAccessor_1 : {
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
                },
                texCoordAccessor_2 : {
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
                },
                texCoordAccessor_3 : {
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
                                TEXCOORD_0 : 'texCoordAccessor_1'
                            },
                            material : 'material_1'
                        },
                        {
                            attributes : {
                                TEXCOORD_0 : 'texCoordAccessor_2'
                            },
                            material : 'material_2'
                        },
                        {
                            attributes : {
                                TEXCOORD_0 : 'texCoordAccessor_3'
                            },
                            material : 'material_3'
                        }
                    ]
                }
            },
            materials : {
                material_1 : {
                    technique : 'technique_1'
                },
                material_2 : {
                    technique : 'technique_2'
                },
                material_3 : {
                    technique : 'technique_3'
                }
            },
            techniques : {
                technique_1 : {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 'program_1'
                },
                technique_2 : {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 'program_2'
                },
                technique_3 : {
                    attributes : {
                        a_texcoord : 'texcoord'
                    },
                    parameters : {
                        texcoord : {
                            semantic : 'TEXCOORD_0',
                            type : WebGLConstants.FLOAT_VEC2
                        }
                    },
                    program : 'program_3'
                }
            },
            programs : {
                program_1 : {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 'VS_1'
                },
                program_2 : {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 'VS_2'
                },
                program_3 : {
                    attributes : [
                        'a_texcoord'
                    ],
                    vertexShader : 'VS_1'
                }
            },
            shaders : {
                VS_1 : {
                    type: WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                },
                VS_2 : {
                    type: WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : ''
                        }
                    }
                }
            }
        };

        spyOn(Cesium.ShaderSource, 'replaceMain');
        compressTextureCoordinates(gltf).then(function() {
            expect(Cesium.ShaderSource.replaceMain).toHaveBeenCalledTimes(2);
            done();
        });
    });
});
