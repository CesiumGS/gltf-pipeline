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
                "access": ''
            }
        },
        "materials": {
            "blinn-1": {},
            "lambert-1": {}
        }
    };

    var allIdentifiersGltf = {
        "nodes": {
            "name" : ''
        },
        "skins": {
            "name_0": ''
        },
        "cameras": {
            "name_1": ''
        },
        "meshes": {
            "name_2": ''
        },
        "accessors": {
            "name_3": ''
        },
        "materials": {
            "name_4": ''
        },
        "bufferViews": {
            "name_5": ''
        },
        "techniques": {
            "name_6": ''
        },
        "textures": {
            "name_7": ''
        },
        "buffers": {
            "name_8": ''
        },
        "programs": {
            "name_9": ''
        },
        "images": {
            "name_10": ''
        },
        "samplers": {
            "name_11": ''
        },
        "shaders": {
            "name_12": ''
        }
    };

    it('locates IDs in the top level objects of the gltf and adjusts accordingly', function() {
        expect(getUniqueId(gltf, 'accessor')).toEqual('accessor_2');
    });

    it('does not modify the prefix if the prefix does not occur in top level objects of the gltf', function() {
        expect(getUniqueId(gltf, 'access')).toEqual('access');
    });

    it('can identify instances of the prefix across different top level objects', function() {
        expect(getUniqueId(allIdentifiersGltf, 'name')).toEqual('name_13');
    });
});
