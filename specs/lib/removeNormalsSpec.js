'use strict';

var removeNormals = require('../../lib/removeNormals');

describe('removeNormals', function() {
    it('removes normals and strips the technique from the material', function() {
        var gltf = {
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
                material : {
                    technique : 'technique'
                }
            },
            techniques : {
                technique : {}
            }
        };
        removeNormals(gltf);
        expect(gltf.meshes.mesh.primitives[0].attributes.NORMAL).not.toBeDefined();
        expect(gltf.materials.material.technique).not.toBeDefined();
    });

    it('handles undefined technique', function() {
        var gltf = {
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
        expect(gltf.meshes.mesh.primitives[0].attributes.NORMAL).not.toBeDefined();
    });

    it('handles undefined material', function() {
        var gltf = {
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
        expect(gltf.meshes.mesh.primitives[0].attributes.NORMAL).not.toBeDefined();
    });

    it('only deletes normals and handles subscripts', function() {
        var gltf = {
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
                technique : {}
            }
        };
        removeNormals(gltf);
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives[0].attributes.NORMAL).not.toBeDefined();
        expect(primitives[0].attributes.POSITION).toBeDefined();
        expect(primitives[0].material).toBeDefined();
        expect(gltf.materials.material.technique).not.toBeDefined();
        expect(primitives[1].attributes.NORMAL).not.toBeDefined();
        expect(primitives[1].attributes.NORMAL_0).not.toBeDefined();
        expect(primitives[1].attributes.POSITION).toBeDefined();
        expect(primitives[1].material).toBeDefined();
        expect(gltf.materials.material2.technique).not.toBeDefined();
    });
});