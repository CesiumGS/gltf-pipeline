'use strict';
var getJointCountForMaterials = require('../../lib/getJointCountForMaterials');

describe('getJointCountForMaterials', function() {
    fit('gets joint counts for materials on skinned meshes', function() {
        var gltf = {
            materials : [{}, {}],
            meshes : [{
                primitives : [{
                    material : 1
                }]
            }, {
                primitives : [{
                    material : 0
                }]
            }],
            nodes : [{
                mesh : 0,
                skin : 0
            }],
            skins : [{
                joints : [0, 1, 2, 3, 4]
            }]
        };
        var jointCounts = getJointCountForMaterials(gltf);
        expect(jointCounts[0]).not.toBeDefined();
        expect(jointCounts[1]).toEqual(5);
    });
});