'use strict';
var generateModelMaterialsCommon = require('../../lib/generateModelMaterialsCommon');

describe('generateModelMaterialsCommon', function() {
    it('removes techniques, programs, and shaders', function() {
        var gltf = {
            techniques : {},
            programs : {},
            shaders : {}
        };
        generateModelMaterialsCommon(gltf);
        expect(gltf.extensionsUsed).toEqual(['KHR_materials_common']);
        expect(gltf.techniques).not.toBeDefined();
        expect(gltf.programs).not.toBeDefined();
        expect(gltf.shaders).not.toBeDefined();
    });

    it('generates a KHR_materials_common material with values', function() {
        var gltf = {
            materials : {
                material : {
                    values : {
                        ambient : [0, 0, 0, 1],
                        otherAttribute : true
                    }
                }
            }
        };
        generateModelMaterialsCommon(gltf, {
            technique : 'PHONG',
            doubleSided : true,
            someAttribute : true
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
});