'use strict';
var mergeDuplicateMaterials = require('../../lib/mergeDuplicateMaterials');

describe('mergeDuplicateMaterials', function() {
    it('merges duplicate materials', function() {
        var gltf = {
            meshes : {
                meshOne : {
                    primitives : [
                        {
                            material : 'materialOne'
                        },
                        {
                            material : 'materialThree'
                        }
                    ]
                },
                meshTwo : {
                    primitives : [
                        {
                            material : 'materialTwo'
                        },
                        {
                            material : 'materialThree'
                        }
                    ]
                }
            },
            materials : {
                materialOne : {
                    key : 'value',
                    arrayOf : ['values'],
                    nested : {
                        key : 'value'
                    }
                },
                materialTwo : {
                    key : 'value',
                    arrayOf : ['different', 'values'],
                    nested : {
                        key : 'value'
                    }
                },
                materialThree : {
                    key : 'value',
                    arrayOf : ['values'],
                    nested : {
                        key : 'value'
                    }
                }
            }
        };
        mergeDuplicateMaterials(gltf);
        var materials = gltf.materials;
        expect(materials.materialOne).toBeDefined();
        expect(materials.materialTwo).toBeDefined();
        expect(materials.materialThree).not.toBeDefined();
        var meshes = gltf.meshes;
        var meshOne = meshes.meshOne;
        var meshOnePrimitives = meshOne.primitives;
        expect(meshOnePrimitives[0].material).toBe('materialOne');
        expect(meshOnePrimitives[1].material).toBe('materialOne');
        var meshTwo = meshes.meshTwo;
        var meshTwoPrimitives = meshTwo.primitives;
        expect(meshTwoPrimitives[0].material).toBe('materialTwo');
        expect(meshTwoPrimitives[1].material).toBe('materialOne');
    });
});