'use strict';

var removeUnusedSkins = require('../../lib/removeUnusedSkins');
var OptimizationStatistics = require('../../lib/OptimizationStatistics');

describe('removeUnusedSkins', function() {
    it('removes a skin', function() {
        var gltf = {
            "nodes": {
                "Cylinder": {
                    "skin": "Armature_Cylinder-skin"
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ]
                },
                "unusedSkinId": {
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSkins(gltf, stats);
        expect(gltf.skins.unusedSkinId).not.toBeDefined();
        expect(stats.numberRemoved.skins).toEqual(1);
    });

    it('does not remove any skins', function() {
        var gltf = {
            "nodes": {
                "Cylinder": {
                    "skin": "Armature_Cylinder-skin"
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSkins(gltf, stats);
        expect(gltf.skins["Armature_Cylinder-skin"]).toBeDefined();
        expect(stats.numberRemoved.skins).toEqual(0);
    });
});