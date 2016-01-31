'use strict';

var removeUnusedMaterials = require('../../').removeUnusedMaterials;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedMaterials', function() {
    it('removes a material', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256
                    }
                },
                "unusedMaterialId": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256
                    }
                }
            },
            "meshes": {
                "Geometry-mesh002": {
                    "primitives": [
                        {
                            "material": "Effect-Texture"
                        }
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedMaterials(gltf, stats);
        expect(gltf.materials.unusedMaterialId).not.toBeDefined();
        expect(stats.numberRemoved.materials).toEqual(1);
    });

    it('does not remove any materials', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256
                    }
                }
            },
            "meshes": {
                "Geometry-mesh002": {
                    "primitives": [
                        {
                            "material": "Effect-Texture"
                        }
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedMaterials(gltf, stats);
        expect(gltf.materials["Effect-Texture"]).toBeDefined();
        expect(stats.numberRemoved.materials).toEqual(0);
    });
});