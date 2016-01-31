'use strict';

var removeUnusedMeshes = require('../../').removeUnusedMeshes;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedMeshes', function() {
    it('removes a mesh', function() {
        var gltf = {
            "meshes": {
                "Geometry-mesh002": {},
                "unusedMeshId": {}
            },
            "nodes": {
                "Geometry-mesh002Node": {
                    "meshes": [
                        "Geometry-mesh002"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedMeshes(gltf, stats);
        expect(gltf.meshes.unusedMeshId).not.toBeDefined();
        expect(stats.numberRemoved.meshes).toEqual(1);
    });

    it('does not remove any meshes', function() {
        var gltf = {
            "meshes": {
                "Geometry-mesh002": {}
            },
            "nodes": {
                "Geometry-mesh002Node": {
                    "meshes": [
                        "Geometry-mesh002"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedMeshes(gltf, stats);
        expect(gltf.meshes["Geometry-mesh002"]).toBeDefined();
        expect(stats.numberRemoved.meshes).toEqual(0);
    });
});