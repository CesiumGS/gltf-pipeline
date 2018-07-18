'use strict';
var clone = require('clone');
var combineMeshes = require('../../lib/combineMeshes');

describe('combineMeshes', function() {
    it('does not affect nodes with one mesh', function() {
        var gltf = {
            "meshes": {
                "mesh_0": {
                    "primitives": [
                        {
                            "material": "mat_0"
                        }
                    ]
                },
                "mesh_1": {
                    "primitives": [
                        {
                            "material": "mat_1"
                        }
                    ]
                }
            },
            "nodes": {
                "node_0": {
                    "meshes": [
                        "mesh_0"
                    ]
                },
                "node_1": {
                    "meshes": [
                        "mesh_1"
                    ]
                }
            }
        };

        expect(gltf).toEqual(combineMeshes(clone(gltf)));
    });

    it('combines both meshes', function() {
        var gltf = {
            "meshes": {
                "mesh_0": {
                    "primitives": [
                        {
                            "material": "mat_0"
                        }
                    ]
                },
                "mesh_1": {
                    "primitives": [
                        {
                            "material": "mat_1"
                        }
                    ]
                }
            },
            "nodes": {
                "node_0": {
                    "meshes": [
                        "mesh_0",
                        "mesh_1"
                    ]
                }
            }
        };

        combineMeshes(gltf);

        expect(gltf.nodes.node_0.meshes).toEqual(['node_0_mesh_0']);
        expect(gltf.meshes.node_0_mesh_0).toBeDefined();
        expect(gltf.meshes.node_0_mesh_0.primitives).toEqual([
            {
                "material": 'mat_0'
            },
            {
                "material": 'mat_1'
            }
        ]);
    });

    it('combines some meshes', function() {
        var gltf = {
            "meshes": {
                "mesh_0": {
                    "primitives": [
                        {
                            "material": "mat_0"
                        }
                    ]
                },
                "mesh_1": {
                    "primitives": [
                        {
                            "material": "mat_1"
                        }
                    ]
                }
            },
            "nodes": {
                "node_0": {
                    "meshes": [
                        "mesh_0",
                        "mesh_1"
                    ]
                },
                "node_1": {
                    "meshes": [
                        "mesh_0"
                    ]
                }
            }
        };

        var combinedGltf = combineMeshes(clone(gltf));

        expect(combinedGltf.nodes.node_0.meshes).toEqual(['node_0_mesh_0']);
        expect(combinedGltf.meshes.node_0_mesh_0).toBeDefined();
        expect(combinedGltf.meshes.node_0_mesh_0.primitives).toEqual([
            {
                "material": 'mat_0'
            },
            {
                "material": 'mat_1'
            }
        ]);
        expect(combinedGltf.nodes.node_1).toEqual(gltf.nodes.node_1);
        expect(combinedGltf.meshes.mesh_0).toEqual(gltf.meshes.mesh_0);
        expect(combinedGltf.meshes.mesh_1).toEqual(gltf.meshes.mesh_1);
    });
});
