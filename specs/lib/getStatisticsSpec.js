'use strict';
var getStatistics = require('../../lib/getStatistics');

describe('getStatistics', function() {
    it('returns statistics for a gltf', function() {
        var gltf = {
            accessors: [
                {
                    count: 1
                }, {
                    count: 2
                }, {
                    count: 6
                }
            ],
            buffers: [
                {
                    byteLength: 140
                }, {
                    byteLength: 120,
                    uri: 'external_buffer'
                }
            ],
            images: [
                {
                    uri: 'external_image'
                }, {
                    uri: 'data:image/png;'
                }, {
                    uri: 'another_external_image'
                }
            ],
            meshes: [
                {
                    primitives: [
                        {
                            indices: 0,
                            mode: 0 // POINTS
                        }, {
                            indices: 1,
                            mode: 1 // LINES
                        }
                    ]
                }, {
                    primitives: [
                        {
                            indices: 2,
                            mode: 4 // TRIANGLES
                        }
                    ]
                }
            ],
            materials: [
                {}, {}
            ],
            animations: [
                {}, {} ,{}
            ],
            shaders: [
                {
                    uri: 'external_shader'
                }, {
                    uri: 'data:text/plain;'
                }
            ],
            nodes: [
                {}
            ]
        };
        var statistics = getStatistics(gltf);
        expect(statistics.buffersSizeInBytes).toEqual(260);
        expect(statistics.numberOfImages).toEqual(3);
        expect(statistics.numberOfExternalRequests).toEqual(4);
        expect(statistics.numberOfDrawCalls).toEqual(3);
        expect(statistics.numberOfRenderedPrimitives).toEqual(4);
        expect(statistics.numberOfNodes).toEqual(1);
        expect(statistics.numberOfMeshes).toEqual(2);
        expect(statistics.numberOfMaterials).toEqual(2);
        expect(statistics.numberOfAnimations).toEqual(3);
    });
});
