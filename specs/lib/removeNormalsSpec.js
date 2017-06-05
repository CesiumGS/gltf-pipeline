'use strict';

var removeNormals = require('../../lib/removeNormals');
var techniqueParameterForSemantic = require('../../lib/techniqueParameterForSemantic');

describe('removeNormals', function() {
    it('removes normals and generates constant technique', function() {
        var gltf = {
            asset : {},
            meshes : {
                mesh: {
                    primitives: [
                        {
                            attributes: {
                                POSITION : 'position_accessor',
                                NORMAL: 'normal_accessor'
                            },
                            material: 'material'
                        }
                    ]
                }
            },
            materials : {
                material : {
                    technique : 'technique'
                }
            },
            techniques : {
                technique : {}
            }
        };
        removeNormals(gltf);
        var primitive = gltf.meshes.mesh.primitives[0];
        var material = gltf.materials[primitive.material];
        var technique = gltf.techniques[material.technique];
        expect(primitive.attributes.NORMAL).toBeUndefined();
        expect(technique).toBeDefined();
        var parameter = techniqueParameterForSemantic(technique, 'NORMAL');
        expect(parameter).toBeUndefined(); // Technique should not reference normals
    });

    it('handles undefined technique', function() {
        var gltf = {
            asset : {},
            meshes : {
                mesh: {
                    primitives: [
                        {
                            attributes: {
                                NORMAL: 'some_accessor'
                            },
                            material: 'material'
                        }
                    ]
                }
            },
            materials : {
                material : {}
            }
        };
        removeNormals(gltf);
        expect(gltf.meshes.mesh.primitives[0].attributes.NORMAL).toBeUndefined();
    });

    it('handles undefined material', function() {
        var gltf = {
            asset : {},
            meshes : {
                mesh: {
                    primitives: [
                        {
                            attributes: {
                                NORMAL: 'some_accessor'
                            }
                        }
                    ]
                }
            }
        };
        removeNormals(gltf);
        expect(gltf.meshes.mesh.primitives[0].attributes.NORMAL).toBeUndefined();
    });

    it('only deletes normals and handles subscripts', function() {
        var gltf = {
            asset : {},
            meshes : {
                mesh: {
                    primitives: [{
                        attributes: {
                            POSITION: 'some_accessor',
                            NORMAL: 'another_accessor'
                        },
                        material: 'material'
                    }, {
                        attributes: {
                            POSITION: 'some_accessor_2',
                            NORMAL: 'another_accessor_2',
                            NORMAL_0: 'subscripted_accessor'
                        },
                        material: 'material2'
                    }]
                }
            },
            materials : {
                material : {
                    technique : 'technique'
                },
                material2 : {
                    technique : 'technique2'
                }
            },
            techniques : {
                technique : {},
                technique2 : {}
            }
        };
        removeNormals(gltf);
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives[0].attributes.NORMAL).toBeUndefined();
        expect(primitives[0].attributes.POSITION).toBeDefined();
        expect(primitives[1].attributes.NORMAL).toBeUndefined();
        expect(primitives[1].attributes.NORMAL_0).toBeUndefined();
        expect(primitives[1].attributes.POSITION).toBeDefined();
    });
});
