'use strict';
var Cesium = require('cesium');
var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var WebGLConstants = Cesium.WebGLConstants;
var octEncodeNormals = require('../../lib/octEncodeNormals');

describe('octEncodeNormals', function() {
   it('oct-encodes normals', function(done) {
       var normals = new Float32Array([1.0, 0.0, 0.0,
                                       0.0, 1.0, 0.0,
                                       0.0, 0.0, 1.0]);
       var normalBuffer = new Buffer(normals.buffer.slice(0));
       var gltf = {
           accessors : {
               normalAccessor : {
                   byteOffset : 0,
                   byteStride : 0,
                   bufferView : 'bufferView',
                   componentType : WebGLConstants.FLOAT,
                   count : 3,
                   max : [
                       1.0, 1.0, 1.0
                   ],
                   min : [
                       0.0, 0.0, 0.0
                   ],
                   type : 'VEC3'
               }
           },
           buffers : {
               buffer : {
                   byteLength : normalBuffer.length,
                   extras : {
                       _pipeline : {
                           source : normalBuffer
                       }
                   }
               }
           },
           bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : normalBuffer.length,
                    byteOffset : 0
                }
           },
           meshes : {
               mesh : {
                   primitives : [
                       {
                           attributes : {
                               NORMAL : 'normalAccessor'
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
                       a_normal : 'normal'
                   },
                   parameters : {
                       normal : {
                           semantic : 'NORMAL',
                           type : WebGLConstants.FLOAT_VEC3
                       }
                   },
                   program : 'program'
               }
           },
           programs : {
               program : {
                   attributes : [
                       'a_normal'
                   ],
                   vertexShader : 'VS'
               }
           },
           shaders : {
               VS : {
                   type: WebGLConstants.VERTEX_SHADER,
                   extras : {
                       _pipeline : {
                           source : ''
                       }
                   }
               }
           }
       };
       octEncodeNormals(gltf).then(function() {
           var normalAccessor = gltf.accessors.normalAccessor;
           expect(normalAccessor.componentType).toEqual(WebGLConstants.UNSIGNED_BYTE);
           expect(normalAccessor.type).toEqual('VEC2');
    
           var technique = gltf.techniques.technique;
           expect(technique.parameters.normal.type).toEqual(WebGLConstants.INT_VEC2);
    
           var buffer = gltf.buffers.buffer;
           var encodedBuffer = buffer.extras._pipeline.source;
           expect(encodedBuffer.length).toEqual(6);
           expect(encodedBuffer.length).toEqual(buffer.byteLength);

           var vs = gltf.shaders.VS.extras._pipeline.source;
           expect(typeof vs).toEqual('string');

           var normal = new Cartesian3();
           for (var i = 0; i < normalAccessor.count; i++) {
               var compressed = Cartesian2.unpack(encodedBuffer, i*2);
               AttributeCompression.octDecode(compressed.x, compressed.y, normal);
               expect(normal.x).toBeCloseTo(normals[i*3]);
               expect(normal.y).toBeCloseTo(normals[i*3 + 1]);
               expect(normal.z).toBeCloseTo(normals[i*3 + 2]);
           }
           done();
       });
   });

    it('should only patch a program whos shader has not been patched yet', function(done) {
        var normals = new Float32Array([1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0]);
        var normalBuffer = new Buffer(normals.buffer.slice(0));
        var gltf = {
            accessors : {
                normalAccessor_1 : {
                    byteOffset : 0,
                    byteStride : 0,
                    bufferView : 'bufferView',
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0, 0.0
                    ],
                    type : 'VEC3'
                },
                normalAccessor_2 : {
                    byteOffset : 0,
                    byteStride : 0,
                    bufferView : 'bufferView',
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0, 0.0
                    ],
                    type : 'VEC3'
                },
                normalAccessor_3 : {
                    byteOffset : 0,
                    byteStride : 0,
                    bufferView : 'bufferView',
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0, 0.0
                    ],
                    type : 'VEC3'
                }
            },
            buffers : {
                buffer : {
                    byteLength : normalBuffer.length,
                    extras : {
                        _pipeline : {
                            source : normalBuffer
                        }
                    }
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : normalBuffer.length,
                    byteOffset : 0
                }
            },
            meshes : {
                mesh : {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 'normalAccessor_1'
                            },
                            material : 'material_1'
                        },
                        {
                            attributes : {
                                NORMAL : 'normalAccessor_2'
                            },
                            material : 'material_2'
                        },
                        {
                            attributes : {
                                NORMAL : 'normalAccessor_3'
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
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 'program_1'
                },
                technique_2 : {
                    attributes : {
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 'program_2'
                },
                technique_3 : {
                    attributes : {
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 'program_3'
                }
            },
            programs : {
                program_1 : {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 'VS_1'
                },
                program_2 : {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 'VS_1'
                },
                program_3 : {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 'VS_2'
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
        octEncodeNormals(gltf).then(function() {
            expect(Cesium.ShaderSource.replaceMain).toHaveBeenCalledTimes(2);
            done();
        });
    });
});