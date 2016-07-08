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
                           source : new Buffer('')
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
});