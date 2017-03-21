'use strict';
var Cesium = require('cesium');
var octEncodeNormals = require('../../lib/octEncodeNormals');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var WebGLConstants = Cesium.WebGLConstants;

describe('octEncodeNormals', function() {
   it('oct-encodes normals', function() {
       var normals = new Float32Array([1.0, 0.0, 0.0,
                                       0.0, 1.0, 0.0,
                                       0.0, 0.0, 1.0]);
       var normalBuffer = new Buffer(normals.buffer.slice(0));
       var gltf = {
           accessors : [
               {
                   byteOffset : 0,
                   bufferView : 0,
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
           ],
           buffers : [
               {
                   byteLength : normalBuffer.length,
                   extras : {
                       _pipeline : {
                           source : normalBuffer
                       }
                   }
               }
           ],
           bufferViews : [
                {
                    buffer : 0,
                    byteLength : normalBuffer.length,
                    byteOffset : 0
                }
           ],
           meshes : [
               {
                   primitives : [
                       {
                           attributes : {
                               NORMAL : 0
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
                       a_normal : 'normal'
                   },
                   parameters : {
                       normal : {
                           semantic : 'NORMAL',
                           type : WebGLConstants.FLOAT_VEC3
                       }
                   },
                   program : 0
               }
           ],
           programs : [
               {
                   attributes : [
                       'a_normal'
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
               }
           ]
       };
       octEncodeNormals(gltf);
       uninterleaveAndPackBuffers(gltf);
       var normalAccessor = gltf.accessors[0];
       expect(normalAccessor.componentType).toEqual(WebGLConstants.UNSIGNED_BYTE);
       expect(normalAccessor.type).toEqual('VEC2');

       var technique = gltf.techniques[0];
       expect(technique.parameters.normal.type).toEqual(WebGLConstants.INT_VEC2);

       var buffer = gltf.buffers[0];
       var encodedBuffer = buffer.extras._pipeline.source;
       expect(encodedBuffer.length).toEqual(6);
       expect(encodedBuffer.length).toEqual(buffer.byteLength);

       var vs = gltf.shaders[0].extras._pipeline.source;
       expect(typeof vs).toEqual('string');

       var normal = new Cartesian3();
       for (var i = 0; i < normalAccessor.count; i++) {
           var compressed = Cartesian2.unpack(encodedBuffer, i*2);
           AttributeCompression.octDecode(compressed.x, compressed.y, normal);
           expect(normal.x).toBeCloseTo(normals[i*3]);
           expect(normal.y).toBeCloseTo(normals[i*3 + 1]);
           expect(normal.z).toBeCloseTo(normals[i*3 + 2]);
       }
   });

    it('should only patch a program whos shader has not been patched yet', function() {
        var normals = new Float32Array([1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0]);
        var normalBuffer = new Buffer(normals.buffer.slice(0));
        var gltf = {
            accessors : [{
                    byteOffset : 0,
                    bufferView : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0, 0.0
                    ],
                    type : 'VEC3'
                }, {
                    byteOffset : 0,
                    bufferView : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : 3,
                    max : [
                        1.0, 1.0, 1.0
                    ],
                    min : [
                        0.0, 0.0, 0.0
                    ],
                    type : 'VEC3'
                },{
                    byteOffset : 0,
                    bufferView : 0,
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
            ],
            buffers : [
                {
                    byteLength : normalBuffer.length,
                    extras : {
                        _pipeline : {
                            source : normalBuffer
                        }
                    }
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : normalBuffer.length,
                    byteOffset : 0
                }
            ],
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                NORMAL : 0
                            },
                            material : 0
                        }, {
                            attributes : {
                                NORMAL : 1
                            },
                            material : 1
                        }, {
                            attributes : {
                                NORMAL : 2
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
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 0
                }, {
                    attributes : {
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 1
                }, {
                    attributes : {
                        a_normal : 'normal'
                    },
                    parameters : {
                        normal : {
                            semantic : 'NORMAL',
                            type : WebGLConstants.FLOAT_VEC3
                        }
                    },
                    program : 2
                }
            ],
            programs : [
                {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 0
                }, {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 0
                }, {
                    attributes : [
                        'a_normal'
                    ],
                    vertexShader : 1
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
        octEncodeNormals(gltf);
        expect(Cesium.ShaderSource.replaceMain).toHaveBeenCalledTimes(2);
    });
});