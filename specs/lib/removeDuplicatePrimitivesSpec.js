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
});