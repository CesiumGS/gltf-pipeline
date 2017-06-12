'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var compressIntegerAccessors = require('../../lib/compressIntegerAccessors');

var cantCompressByte = new Buffer([-1, 0, 1]);
var cantCompressUByte = new Buffer([0, 1, 2]);
var cantCompressIndices = new Buffer(new Uint16Array([1, 2, 3]).buffer);
var cantCompressBigShort = new Buffer(new Uint16Array([0, 1, 65535]).buffer);
var floatToShort = new Buffer(new Float32Array([32767.0, -1.0, 0.0]).buffer);
var floatToByte = new Buffer(new Float32Array([255.0, -1.0, 0.0]).buffer);
var shortToByte = new Buffer(new Uint16Array([-2, 0, 2]).buffer);
var testGltf = {
    accessors : {
        cantCompressByte : {
            bufferView : 'cantCompressByteBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.BYTE,
            count : 3,
            type : "SCALAR"
        },
        cantCompressUByte : {
            bufferView : 'cantCompressUByteBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.UNSIGNED_BYTE,
            count : 3,
            type : "SCALAR"
        },
        cantCompressIndices : {
            bufferView : 'cantCompressIndicesBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.UNSIGNED_SHORT,
            count : 3,
            type : "SCALAR"
        },
        cantCompressBigShort : {
            bufferView : 'cantCompressBigShortBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.UNSIGNED_SHORT,
            count : 3,
            type : "SCALAR"
        },
        floatToShort : {
            bufferView : 'floatToShortBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.FLOAT,
            count : 3,
            type : "SCALAR"
        },
        floatToByte : {
            bufferView : 'floatToByteBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.FLOAT,
            count : 3,
            type : "SCALAR"
        },
        shortToByte : {
            bufferView : 'shortToByteBufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.SHORT,
            count : 3,
            type : "SCALAR"
        }
    },
    bufferViews : {
        cantCompressByteBufferView : {
            buffer : 'cantCompressByteBuffer',
            byteOffset : 0,
            byteLength : cantCompressByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        },
        cantCompressUByteBufferView : {
            buffer : 'cantCompressUByteBuffer',
            byteOffset : 0,
            byteLength : cantCompressUByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        },
        cantCompressIndicesBufferView : {
            buffer : 'cantCompressIndicesBuffer',
            byteOffset : 0,
            byteLength : cantCompressIndices.length,
            target : WebGLConstants.ELEMENT_ARRAY_BUFFER
        },
        cantCompressBigShortBufferView : {
            buffer : 'cantCompressBigShortBuffer',
            byteOffset : 0,
            byteLength : cantCompressBigShort.length,
            target : WebGLConstants.ARRAY_BUFFER
        },
        floatToShortBufferView : {
            buffer : 'floatToShortBuffer',
            byteOffset : 0,
            byteLength : floatToShort.length,
            target : WebGLConstants.ARRAY_BUFFER
        },
        floatToByteBufferView : {
            buffer : 'floatToByteBuffer',
            byteOffset : 0,
            byteLength : floatToByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        },
        shortToByteBufferView : {
            buffer : 'shortToByteBuffer',
            byteOffset : 0,
            byteLength : shortToByte.length,
            target : WebGLConstants.ARRAY_BUFFER
        }
    },
    buffers : {
        cantCompressByteBuffer : {
            byteLength : cantCompressByte.length,
            extras : {
                _pipeline : {
                    source : cantCompressByte
                }
            },
            type : "arraybuffer"
        },
        cantCompressUByteBuffer : {
            byteLength : cantCompressUByte.length,
            extras : {
                _pipeline : {
                    source : cantCompressUByte
                }
            },
            type : "arraybuffer"
        },
        cantCompressIndicesBuffer : {
            byteLength : cantCompressIndices.length,
            extras : {
                _pipeline : {
                    source : cantCompressIndices
                }
            },
            type : "arraybuffer"
        },
        cantCompressBigShortBuffer : {
            byteLength : cantCompressBigShort.length,
            extras : {
                _pipeline : {
                    source : cantCompressBigShort
                }
            },
            type : "arraybuffer"
        },
        floatToShortBuffer : {
            byteLength : floatToShort.length,
            extras : {
                _pipeline : {
                    source : floatToShort
                }
            },
            type : "arraybuffer"
        },
        floatToByteBuffer : {
            byteLength : floatToByte.length,
            extras : {
                _pipeline : {
                    source : floatToByte
                }
            },
            type : "arraybuffer"
        },
        shortToByteBuffer : {
            byteLength : shortToByte.length,
            extras : {
                _pipeline : {
                    source : shortToByte
                }
            },
            type : "arraybuffer"
        }
    },
    meshes : {
        mesh : {
            primitives : [
                {
                    attributes : {
                        A : 'cantCompressByte',
                        B : 'cantCompressUByte',
                        C : 'cantCompressIndices',
                        D : 'cantCompressBigShort',
                        E : 'floatToShort',
                        F : 'floatToByte',
                        G : 'shortToByte'
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
        expect(gltf.accessors.cantCompressByte.componentType === WebGLConstants.BYTE);
        expect(gltf.accessors.cantCompressUByte.componentType === WebGLConstants.UNSIGNED_BYTE);
        expect(gltf.accessors.cantCompressIndices.componentType === WebGLConstants.UNSIGNED_SHORT);
        expect(gltf.accessors.cantCompressBigShort.componentType === WebGLConstants.UNSIGNED_SHORT);

        expect(gltf.accessors.floatToShort.componentType === WebGLConstants.UNSIGNED_SHORT);
        expect(gltf.buffers.floatToShortBuffer.extras._pipeline.source.length === 3 * 2);

        expect(gltf.accessors.floatToByte.componentType === WebGLConstants.BYTE);
        expect(gltf.buffers.floatToByteBuffer.extras._pipeline.source.length === 3);

        expect(gltf.accessors.shortToByte.componentType === WebGLConstants.BYTE);
        expect(gltf.buffers.floatToByteBuffer.extras._pipeline.source.length === 3);
    });
});
