'use strict';
var mergeDuplicateTechniques = require('../../lib/mergeDuplicateTechniques');

describe('mergeDuplicateTechniques', function() {
    it('merges duplicate techniques', function() {
        var gltf = {
            techniques : {
                techniqueOne : {
                    key : 'value',
                    arrayOf : ['values'],
                    nested : {
                        key : 'value'
                    }
                },
                techniqueTwo : {
                    key : 'value',
                    arrayOf : ['different', 'values'],
                    nested : {
                        key : 'value'
                    }
                },
                techniqueThree : {
                    key : 'value',
                    arrayOf : ['values'],
                    nested : {
                        key : 'value'
                    }
                }
            },
            materials : {
                materialOne : {
                    technique : 'techniqueOne'
                },
                materialTwo : {
                    technique : 'techniqueTwo'
                },
                materialThree : {
                    technique : 'techniqueThree'
                }
            }
        };
        mergeDuplicateTechniques(gltf);
        var techniques = gltf.techniques;
        expect(techniques.techniqueOne).toBeDefined();
        expect(techniques.techniqueTwo).toBeDefined();
        expect(techniques.techniqueThree).not.toBeDefined();
        var materials = gltf.materials;
        expect(materials.materialOne.technique).toBe('techniqueOne');
        expect(materials.materialTwo.technique).toBe('techniqueTwo');
        expect(materials.materialThree.technique).toBe('techniqueOne');
    });
});
