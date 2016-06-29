'use strict';
var getUniqueId = require('../../lib/getUniqueId');

describe('getUniqueId', function() {
    var gltf = {
        "accessors": {
            "accessor": {
                "bufferView": "bufferView_137"
            },
            "accessor_0": {
                "bufferView": "bufferView_137"
            },
            "accessor_1": {
                "bufferView": "bufferView_138"
            },
            "accessor_2": {
                "bufferView": "bufferView_138"
            },
            "accessor_3": {
                "bufferView": "bufferView_138"
            },
            "name": {
                "bufferView": "bufferView_138"
            }
        },
        "buffers": {
            "bufferId": {
                "byteLength": 840,
                "uri": "buffer.bin"
            },
            "name_0": {
                "byteLength": 840,
                "uri": "buffer.bin"
            }
        },
        "materials": {
            "blinn-1": {
                "technique": "technique1",
                "values": {
                    "ambient": [0, 0, 0, 1]
                },
                "name": "blinn1"
            },
            "lambert-1": {
                "technique": "technique1",
                "values": {
                    "ambient": [0, 0, 0, 1],
                    "diffuse": "texture_file2"
                },
                "name": "lambert1"
            },
            "name_1": {
                "technique": "technique1",
                "values": {
                    "ambient": [0, 0, 0, 1],
                    "diffuse": "texture_file2",
                    "name_2": "wrongName"
                },
                "name": "lambert1"
            }
        }
    };

    it('locates IDs in the top level objects of the gltf and adjusts accordingly', function() {
        expect(getUniqueId(gltf, 'accessor')).toEqual('accessor_4');
    });

    it('does not modify the prefix if the prefix does not occur in top level objects of the gltf', function() {
        expect(getUniqueId(gltf, 'access')).toEqual('access');
    });

    it('can identify instances of the prefix across all top level objects', function() {
        expect(getUniqueId(gltf, 'name')).toEqual('name_2');
    });
});
