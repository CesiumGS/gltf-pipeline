'use strict';

var removeUnusedAccessors = require('../../').removeUnusedAccessors;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedAccessors', function() {
    it('removes an accessor', function() {
        var gltf = {
            "accessors": {
                "IBM_Armature_Cylinder-skin": {
                    "bufferView": "bufferView_43",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 2,
                    "type": "MAT4"
                },
                "accessor_16": {
                    "bufferView": "bufferView_44",
                    "byteOffset": 0,
                    "componentType": 5123,
                    "count": 564,
                    "type": "SCALAR"
                },
                "accessor_18": {
                    "bufferView": "bufferView_45",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 160,
                    "type": "VEC3"
                },
                "animAccessor_0": {
                    "bufferView": "bufferView_43",
                    "byteOffset": 128,
                    "componentType": 5126,
                    "count": 3,
                    "type": "SCALAR"
                },
                "unusedAccessorId": {
                    "bufferView": "bufferView_43",
                    "byteOffset": 128,
                    "componentType": 5126,
                    "count": 3,
                    "type": "SCALAR"
                }
            },
            "animations": {
                "animation_0": {
                    "parameters": {
                        "TIME": "animAccessor_0"
                    }
                }
            },
            "meshes": {
                "Cylinder-mesh": {
                    "primitives": [
                        {
                            "attributes": {
                                "POSITION": "accessor_18"
                            },
                            "indices": "accessor_16",
                            "material": "Material_001-effect"
                        }
                    ]
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": []
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedAccessors(gltf, stats);
        expect(gltf.accessors.unusedAccessorId).not.toBeDefined();
        expect(stats.numberOfAccessorsRemoved).toEqual(1);
    });

    it('does not remove any accessors', function() {
        var gltf = {
            "accessors": {
                "IBM_Armature_Cylinder-skin": {
                    "bufferView": "bufferView_43",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 2,
                    "type": "MAT4"
                },
                "accessor_16": {
                    "bufferView": "bufferView_44",
                    "byteOffset": 0,
                    "componentType": 5123,
                    "count": 564,
                    "type": "SCALAR"
                },
                "accessor_18": {
                    "bufferView": "bufferView_45",
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 160,
                    "type": "VEC3"
                },
                "animAccessor_0": {
                    "bufferView": "bufferView_43",
                    "byteOffset": 128,
                    "componentType": 5126,
                    "count": 3,
                    "type": "SCALAR"
                }
            },
            "animations": {
                "animation_0": {
                    "parameters": {
                        "TIME": "animAccessor_0"
                    }
                }
            },
            "meshes": {
                "Cylinder-mesh": {
                    "primitives": [
                        {
                            "attributes": {
                                "POSITION": "accessor_18"
                            },
                            "indices": "accessor_16",
                            "material": "Material_001-effect"
                        }
                    ]
                }
            },
            "skins": {
                "Armature_Cylinder-skin": {
                    "inverseBindMatrices": "IBM_Armature_Cylinder-skin",
                    "jointNames": []
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedAccessors(gltf, stats);
        expect(gltf.accessors["IBM_Armature_Cylinder-skin"]).toBeDefined();
        expect(gltf.accessors.accessor_16).toBeDefined();
        expect(gltf.accessors.accessor_18).toBeDefined();
        expect(gltf.accessors.animAccessor_0).toBeDefined();
        expect(stats.numberOfAccessorsRemoved).toEqual(0);
    });
});