'use strict';

var removeDuplicatePrimitives = require('../../lib/removeDuplicatePrimitives');

describe('removeDuplicatePrimitives', function() {
    it('removes duplicate primitives', function() {
        var gltf = {
            meshes : {
                mesh : {
                    primitives : [
                        {
                            attributes : {
                                a : 1,
                                b : 2,
                                c : 3
                            },
                            indices : 4
                        },
                        {
                            attributes : {
                                a : 1,
                                b : 2,
                                c : 3
                            },
                            indices : 4
                        },
                        {
                            attributes : {
                                a : 5,
                                b : 6,
                                c : 7
                            },
                            indices : 8
                        }
                    ]
                }
            }
        };
        removeDuplicatePrimitives(gltf);
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives.length).toEqual(2);
        expect(primitives[1].indices).toEqual(8);
    });

    it('combines duplicate primitives across meshes', function() {
        var gltf = {
            meshes : {
                meshA : {
                    primitives : [
                        {
                            attributes : {
                                a : 1,
                                b : 2,
                                c : 3
                            },
                            indices : 4
                        }
                    ]
                },
                meshB : {
                    primitives : [
                        {
                            attributes : {
                                a : 1,
                                b : 2,
                                c : 3
                            },
                            indices : 4
                        }
                    ]
                }
            }
        };
        removeDuplicatePrimitives(gltf);
        var meshes = gltf.meshes;
        expect(meshes['mesh-split']).toBeDefined();
        expect(meshes['mesh-split'].primitives.length).toEqual(1);
        expect(meshes.meshA.primitives.length).toEqual(0);
        expect(meshes.meshB.primitives.length).toEqual(0);
    });
});
