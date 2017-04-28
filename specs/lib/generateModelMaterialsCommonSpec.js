'use strict';
var generateModelMaterialsCommon = require('../../lib/generateModelMaterialsCommon');

describe('generateModelMaterialsCommon', function () {
    it('removes techniques, programs, and shaders', function () {
        var gltf = {
            techniques: [],
            programs: [],
            shaders: []
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        expect(gltf.techniques).not.toBeDefined();
        expect(gltf.programs).not.toBeDefined();
        expect(gltf.shaders).not.toBeDefined();
    });

    it('generates a KHR_materials_common material with values', function () {
        var gltf = {
            materials: [
                {
                    values: {
                        ambient: [0, 0, 0, 1],
                        otherAttribute: true
                    },
                    technique: 0
                }
            ],
            techniques: [
                {
                    parameters: {}
                }
            ]
        };
        generateModelMaterialsCommon(gltf, {
            technique: 'PHONG',
            doubleSided: true,
            someAttribute: true
        });
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials[0];
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
            materials: [
                {
                    values: {
                        diffuse: [1, 0, 0, 0.5]
                    },
                    technique: 0
                }
            ],
            techniques: [
                {
                    parameters: {}
                }
            ]
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials[0];
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.technique).toBe('PHONG');
        var values = materialsCommon.values;
        expect(values.diffuse).toEqual([1, 0, 0, 0.5]);
        expect(values.transparent).toBe(true);
    });

    it('generates a KHR_materials_common with correct transparent flag set if transparency less than 1', function () {
        var gltf = {
            materials: [
                {
                    values: {
                        diffuse: [1, 0, 0, 1],
                        transparency: 0.5
                    },
                    technique: 0
                }
            ],
            techniques: [
                {
                    parameters: {}
                }
            ]
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        var material = gltf.materials[0];
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.technique).toBe('PHONG');
        var values = materialsCommon.values;
        expect(values.diffuse).toEqual([1, 0, 0, 1]);
        expect(values.transparency).toEqual(0.5);
        expect(values.transparent).toBe(true);
    });

    it('generates lights from a technique', function () {
        var gltf = {
            materials: [
                {
                    technique: 0
                }
            ],
            nodes: [
                {}
            ],
            techniques: [
                {
                    parameters: {
                        ambient: {},
                        light0Color: {
                            value: [1, 1, 0.5]
                        },
                        light0Transform: {
                            node: 0
                        }
                    }
                }
            ]
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.nodes[0].extensions.KHR_materials_common.light).toBe('light0');
        var lights = gltf.extensions.KHR_materials_common.lights;
        expect(lights.defaultAmbient.ambient.color).toEqual([1, 1, 1]);
        expect(lights.light0.directional.color).toEqual([1, 1, 0.5]);
        expect(gltf.techniques).not.toBeDefined();
    });

    it('declares jointCount for skinned nodes', function () {
        var gltf = {
            accessors: [
                {
                    count: 4
                }
            ],
            materials: [
                {
                    technique: 0
                }
            ],
            meshes: [
                {
                    primitives: [
                        {
                            material: 0
                        }
                    ]
                }
            ],
            nodes: [
                {
                    mesh: 0,
                    skin: 0
                }
            ],
            skins: [
                {
                    inverseBindMatrices: 0
                }
            ],
            techniques: [
                {
                    parameters: {}
                }
            ]
        };
        generateModelMaterialsCommon(gltf);
        var material = gltf.materials[0];
        var materialsCommon = material.extensions.KHR_materials_common;
        expect(materialsCommon.jointCount).toBe(4);
    });
});