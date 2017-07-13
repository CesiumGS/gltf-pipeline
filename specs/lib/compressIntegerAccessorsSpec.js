'use strict';
var Cesium = require('cesium');
var compressIntegerAccessors = require('../../lib/compressIntegerAccessors');

var WebGLConstants = Cesium.WebGLConstants;

var cantCompressByte = Buffer.from([-1, 0, 1]);
var cantCompressUByte = Buffer.from([0, 1, 2]);
var cantCompressIndices = Buffer.from(new Uint16Array([1, 2, 3]).buffer);
var cantCompressBigShort = Buffer.from(new Uint16Array([0, 1, 65535]).buffer);
var floatToShort = Buffer.from(new Float32Array([32767.0, -1.0, 0.0]).buffer);
var floatToByte = Buffer.from(new Float32Array([255.0, -1.0, 0.0]).buffer);
var shortToByte = Buffer.from(new Uint16Array([-2, 0, 2]).buffer);

var testGltf = {
    accessors : [
        {
            bufferView : 0,
            byteOffset : 0,
            componentType : WebGLConstants.BYTE,
            count : 3,
            type : 'SCALAR',
            name: 'cantCompressByte'
        }, {
            bufferView : 1,
            byteOffset : 0,
            componentType : WebGLConstants.UNSIGNED_BYTE,
            count : 3,
            type : 'SCALAR',
            name: 'cantCompressUByte'
        }, {
            bufferView : 2,
            byteOffset : 0,
            componentType : WebGLConstants.UNSIGNED_SHORT,
            count : 3,
            type : 'SCALAR',
            name: 'cantCompressIndices'
        }, {
            bufferView : 3,
            byteOffset : 0,
            componentType : WebGLConstants.UNSIGNED_SHORT,
            count : 3,
            type : 'SCALAR',
            name: 'cantCompressBigShort'
        }, {
            bufferView : 4,
            byteOffset : 0,
            componentType : WebGLConstants.FLOAT,
            count : 3,
            type : 'SCALAR',
            name: 'floatToShort'
        }, {
            bufferView : 5,
            byteOffset : 0,
            componentType : WebGLConstants.FLOAT,
            count : 3,
            type : 'SCALAR',
            name: 'floatToByte'
        }, {
            bufferView : 6,
            byteOffset : 0,
            componentType : WebGLConstants.SHORT,
            count : 3,
            type : 'SCALAR',
            name: 'shortToByte'
        }
    ],
    bufferViews : [
        {
            buffer : 0,
            byteOffset : 0,
            byteLength : cantCompressByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        }, {
            buffer : 1,
            byteOffset : 0,
            byteLength : cantCompressUByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        }, {
            buffer : 2,
            byteOffset : 0,
            byteLength : cantCompressIndices.length,
            target : WebGLConstants.ELEMENT_ARRAY_BUFFER
        }, {
            buffer : 3,
            byteOffset : 0,
            byteLength : cantCompressBigShort.length,
            target : WebGLConstants.ARRAY_BUFFER
        }, {
            buffer : 4,
            byteOffset : 0,
            byteLength : floatToShort.length,
            target : WebGLConstants.ARRAY_BUFFER
        }, {
            buffer : 5,
            byteOffset : 0,
            byteLength : floatToByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        }, {
            buffer : 6,
            byteOffset : 0,
            byteLength : shortToByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        }
    ],
    buffers : [
        {
            byteLength : cantCompressByte.length,
            extras : {
                _pipeline : {
                    source : cantCompressByte
                }
            }
        }, {
            byteLength : cantCompressUByte.length,
            extras : {
                _pipeline : {
                    source : cantCompressUByte
                }
            }
        }, {
            byteLength : cantCompressIndices.length,
            extras : {
                _pipeline : {
                    source : cantCompressIndices
                }
            }
        }, {
            byteLength : cantCompressBigShort.length,
            extras : {
                _pipeline : {
                    source : cantCompressBigShort
                }
            }
        }, {
            byteLength : floatToShort.length,
            extras : {
                _pipeline : {
                    source : floatToShort
                }
            }
        }, {
            byteLength : floatToByte.length,
            extras : {
                _pipeline : {
                    source : floatToByte
                }
            }
        }, {
            byteLength : shortToByte.length,
            extras : {
                _pipeline : {
                    source : shortToByte
                }
            }
        }
    ],
    meshes : {
        mesh : {
            primitives : [
                {
                    attributes : {
                        A : 0,
                        B : 1,
                        C : 2,
                        D : 3,
                        E : 4,
                        F : 5,
                        G : 6
                    }
                }
            ]
        }
    }
};

describe('compressIntegerAccessors', function() {
    it('compresses integer accessors and leaves uncompressible accessors alone', function() {
        var gltf = testGltf;
        compressIntegerAccessors(gltf, {
            semantics : ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        });
        expect(gltf.accessors[0].componentType === WebGLConstants.BYTE);
        expect(gltf.accessors[1].componentType === WebGLConstants.UNSIGNED_BYTE);
        expect(gltf.accessors[2].componentType === WebGLConstants.UNSIGNED_SHORT);
        expect(gltf.accessors[3].componentType === WebGLConstants.UNSIGNED_SHORT);

        expect(gltf.accessors[4].componentType === WebGLConstants.UNSIGNED_SHORT);
        expect(gltf.buffers[4].extras._pipeline.source.length === 3 * 2);

        expect(gltf.accessors[5].componentType === WebGLConstants.BYTE);
        expect(gltf.buffers[5].extras._pipeline.source.length === 3);

        expect(gltf.accessors[6].componentType === WebGLConstants.BYTE);
        expect(gltf.buffers[6].extras._pipeline.source.length === 3);
    });
});
