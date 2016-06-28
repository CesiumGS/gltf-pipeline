'use strict';
var getUniqueId = require('../../lib/getUniqueId');

describe('getUniqueId', function() {
    var json = {
        "accessors": {
            "accessor": {
                "bufferView": "bufferView_137",
                "byteOffset": 216,
                "byteStride": 0,
                "componentType": 5123,
                "count": 36,
                "type": "SCALAR"
            },
            "accessor_0": {
                "bufferView": "bufferView_137",
                "byteOffset": 216,
                "byteStride": 0,
                "componentType": 5123,
                "count": 36,
                "type": "SCALAR"
            },
            "accessor_1": {
                "bufferView": "bufferView_138",
                "byteOffset": 3456,
                "byteStride": 12,
                "componentType": 5126,
                "count": 36,
                "type": "VEC3"
            },
            "accessor_2": {
                "bufferView": "bufferView_138",
                "byteOffset": 3888,
                "byteStride": 12,
                "componentType": 5126,
                "count": 36,
                "type": "VEC3"
            },
            "accessor_3": {
                "bufferView": "bufferView_138",
                "byteOffset": 4320,
                "byteStride": 8,
                "componentType": 5126,
                "count": 36,
                "type": "VEC2"
            },
            "accessor_4": {
                "bufferView": "bufferView_137",
                "byteOffset": 288,
                "byteStride": 0,
                "componentType": 5123,
                "count": 36,
                "type": "SCALAR"
            }
        },
        "buffers": {
            "bufferId": {
                "byteLength": 840,
                "uri": "buffer.bin"
            }
        },
        "buffers_1": {
            "bufferId": {
                "byteLength": 840,
                "uri_0": "buffer.bin"
            }
        },
        "buffers_0": {
            "bufferId": {
                "byteLength": 840,
                "uri_1": "buffer.bin"
            }
        },
        "materials": {
            "blinn-1": {
                "technique": "technique1",
                "values": {
                    "ambient": [0, 0, 0, 1],
                    "diffuse": "texture_file2",
                    "emission": [0, 0, 0, 1],
                    "shininess": 38.4,
                    "specular": [0, 0, 0, 1]
                },
                "name": "blinn1"
            }
        }
    };

    it('locates IDs at the top level of the json and adjusts accordingly', function() {
        expect(getUniqueId(json, 'buffers')).toEqual('buffers_2');
    });

    it('locates IDs at the leaves of the json and adjusts accordingly', function() {
        expect(getUniqueId(json, 'uri')).toEqual('uri_2');
    });

    it('locates IDs at intermediate objects in the json and adjusts accordingly', function() {
        expect(getUniqueId(json, 'accessor')).toEqual('accessor_5');
    });

    it('does not modify the prefix if the prefix does not occur in the json', function() {
        expect(getUniqueId(json, 'access')).toEqual('access');
    });
});
