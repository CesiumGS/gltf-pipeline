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
            }
        },
        "buffers": {
            "bufferId": {
                "accessor": {}
            }
        },
        "materials": {
            "blinn-1": {},
            "lambert-1": {}
        }
    };

    var allIdentifiersGltf = {
        "nodes": {
            "id" : {}
        },
        "skins": {
            "id_0": {}
        },
        "cameras": {
            "id_1": {}
        },
        "meshes": {
            "id_2": {}
        },
        "accessors": {
            "id_3": {}
        },
        "materials": {
            "id_4": {}
        },
        "bufferViews": {
            "id_5": {}
        },
        "techniques": {
            "id_6": {}
        },
        "textures": {
            "id_7": {}
        },
        "buffers": {
            "id_8": {}
        },
        "programs": {
            "id_9": {}
        },
        "images": {
            "id_10": {}
        },
        "samplers": {
            "id_11": {}
        },
        "shaders": {
            "id_12": {}
        }
    };

    it('locates IDs in the top level objects of the gltf and adjusts accordingly', function() {
        expect(getUniqueId(gltf, 'accessor')).toEqual('accessor_2');
    });

    it('does not modify the prefix if the prefix does not occur in top level objects of the gltf', function() {
        expect(getUniqueId(gltf, 'uniqueId')).toEqual('uniqueId');
    });

    it('can identify instances of the prefix across different top level objects', function() {
        expect(getUniqueId(allIdentifiersGltf, 'id')).toEqual('id_13');
    });
});
