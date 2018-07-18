'use strict';
var generateModelMaterialsCommon = require('../../lib/generateModelMaterialsCommon');

describe('generateModelMaterialsCommon', function () {
    it('removes techniques, programs, and shaders', function () {
        var gltf = {
            techniques: {},
            programs: {},
            shaders: {}
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        expect(gltf.techniques).not.toBeDefined();
        expect(gltf.programs).not.toBeDefined();
        expect(gltf.shaders).not.toBeDefined();
    });

    it('generates a KHR_materials_common material with values', function () {
        var gltf = {
            materials: {
                material: {
                    values: {
                        ambient: [0, 0, 0, 1],
                        otherAttribute: true
                    },
                    technique: 'technique'
                }
            },
            techniques: {
                technique: {
                    parameters: {}
                }
            }
        };
        generateModelMaterialsCommon(gltf, {
            technique: 'PHONG',
            doubleSided: true,
            someAttribute: true
        });
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials.material;
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.doubleSided).toBe(true);
        expect(materialsCommon.technique).toBe('PHONG');
        expect(materialsCommon.someAttribute).toBe(true);
        var values = materialsCommon.values;
        expect(values.ambient).toEqual([0, 0, 0, 1]);
        expect(values.otherAttribute).toBe(true);
    });

    it('generates a KHR_materials_common with correct transparent flag set if diffuse alpha is less than 1', function () {
        var gltf = {
            materials: {
                material: {
                    values: {
                        diffuse: [1, 0, 0, 0.5]
                    },
                    technique: 'technique'
                }
            },
            techniques: {
                technique: {
                    parameters: {}
                }
            }
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials.material;
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.technique).toBe('PHONG');
        var values = materialsCommon.values;
        expect(values.diffuse).toEqual([1, 0, 0, 0.5]);
        expect(values.transparent).toBe(true);
    });

    it('generates a KHR_materials_common with correct transparent flag set if transparency less than 1', function () {
        var gltf = {
            materials: {
                material: {
                    values: {
                        diffuse: [1, 0, 0, 1],
                        transparency: 0.5
                    },
                    technique: 'technique'
                }
            },
            techniques: {
                technique: {
                    parameters: {}
                }
            }
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials.material;
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.technique).toBe('PHONG');
        var values = materialsCommon.values;
        expect(values.diffuse).toEqual([1, 0, 0, 1]);
        expect(values.transparency).toEqual(0.5);
        expect(values.transparent).toBe(true);
    });

    it('generates lights from a technique', function () {
        var gltf = {
            materials: {
                material: {
                    technique: 'technique'
                }
            },
            nodes: {
                lightNode: {}
            },
            techniques: {
                technique: {
                    parameters: {
                        ambient: {},
                        light0Color: {
                            value: [1, 1, 0.5]
                        },
                        light0Transform: {
                            node: 'lightNode'
                        }
                    }
                }
            }
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.nodes.lightNode.extensions.KHR_materials_common.light).toBe('light0');
        var lights = gltf.extensions.KHR_materials_common.lights;
        expect(lights.defaultAmbient.ambient.color).toEqual([1, 1, 1]);
        expect(lights.light0.directional.color).toEqual([1, 1, 0.5]);
        expect(gltf.techniques).not.toBeDefined();
    });

    it('declares jointCount for skinned nodes', function () {
        var gltf = {
            accessors: {
                accessor: {
                    count: 4
                }
            },
            materials: {
                material: {
                    technique: 'technique'
                }
            },
            meshes: {
                mesh: {
                    primitives: [
                        {
                            material: 'material'
                        }
                    ]
                }
            },
            nodes: {
                skinnedNode: {
                    meshes: [
                        'mesh'
                    ],
                    skin: 'skin'
                }
            },
            skins: {
                skin: {
                    inverseBindMatrices: 'accessor'
                }
            },
            techniques: {
                technique: {
                    parameters: {}
                }
            }
        };
        generateModelMaterialsCommon(gltf);
        var material = gltf.materials.material;
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.jointCount).toBe(4);
    });
});
