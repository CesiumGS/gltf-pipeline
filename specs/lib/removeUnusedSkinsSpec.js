'use strict';

var removeUnusedSkins = require('../../').removeUnusedSkins;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedSkins', function() {
    it('removes a skin', function() {
        var gltf = {
            "nodes": {
                "Cylinder": {
                    "children": [],
                    "matrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "meshes": [
                        "Cylinder-mesh"
                    ],
                    "name": "Cylinder",
                    "skeletons": [
                        "Bone"
                    ],
                    "skin": "Armature_Cylinder-skin"
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "bindShapeMatrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ],
                    "name": "Armature"
                },
                "unusedSkinId": {
                    "bindShapeMatrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ],
                    "name": "Armature"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSkins(gltf, stats);
        expect(gltf.skins.unusedSkinId).not.toBeDefined();
        expect(stats.numberOfSkinsRemoved).toEqual(1);
    });

    it('does not remove any skins', function() {
        var gltf = {
            "nodes": {
                "Cylinder": {
                    "children": [],
                    "matrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "meshes": [
                        "Cylinder-mesh"
                    ],
                    "name": "Cylinder",
                    "skeletons": [
                        "Bone"
                    ],
                    "skin": "Armature_Cylinder-skin"
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "bindShapeMatrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": [
                        "Bone"
                    ],
                    "name": "Armature"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedSkins(gltf, stats);
        expect(gltf.skins["Armature_Cylinder-skin"]).toBeDefined();
        expect(stats.numberOfSkinsRemoved).toEqual(0);
    });
});