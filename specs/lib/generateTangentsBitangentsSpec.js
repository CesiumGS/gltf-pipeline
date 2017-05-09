'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var generateTangentsBitangents = require('../../lib/generateTangentsBitangents');
var uninterleaveAndPackBuffers = require('../../lib/uninterleaveAndPackBuffers');

var WebGLConstants = Cesium.WebGLConstants;

describe('generateTangentsBitangents', function(){
    it('generates tangents and bitangents if they do not exist', function() {
        var gltf = {
            accessors: [
                {
                    byteOffset: 0,
                    bufferView: 0,
                    count: 4,
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC3'
                }, {
                    byteOffset: 48,
                    bufferView: 0,
                    count: 4,
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC3'
                }, {
                    byteOffset: 96,
                    bufferView: 0,
                    count: 4,
                    componentType: WebGLConstants.FLOAT,
                    type: 'VEC2'
                }, {
                    byteOffset: 0,
                    bufferView: 1,
                    count: 6,
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    type: 'SCALAR'
                }
            ],
            bufferViews: [
                {
                    byteOffset: 0,
                    byteLength: 128,
                    buffer: 0
                }, {
                    byteOffset: 128,
                    byteLength: 12,
                    buffer: 0
                }
            ],
            buffers: [
                {
                    byteLength: 140,
                    extras: {
                        _pipeline: {
                            source: Buffer.concat([
                                new Buffer(new Float32Array([0, 0, 0,
                                    0, 1, 0,
                                    0, 0, 1,
                                    0, 1, 1
                                    ]).buffer),
                                new Buffer(new Float32Array([1, 0, 0,
                                    1, 0, 0,
                                    1, 0, 0,
                                    1, 0, 0]).buffer),
                                new Buffer(new Float32Array([0, 0,
                                    1, 0,
                                    0, 1,
                                    1, 1]).buffer),
                                new Buffer(new Uint16Array([0, 1, 2, 2, 1, 3]).buffer)
                            ])
                        }
                    }
                }
            ],
            meshes: [
                {
                    primitives: [
                        {
                            attributes: {
                                POSITION: 0,
                                NORMAL: 1,
                                TEXCOORD_0: 2
                            },
                            indices: 3,
                            mode: WebGLConstants.TRIANGLES
                        }
                    ]
                }
            ]
        };

        var byteLengthBefore = gltf.buffers[0].byteLength;
        generateTangentsBitangents(gltf);
        uninterleaveAndPackBuffers(gltf);

        var attributes = gltf.meshes[0].primitives[0].attributes;
        var byteLengthAfter = gltf.buffers[0].byteLength;
        expect(attributes.TANGENT).toBeDefined();
        expect(attributes.BITANGENT).toBeDefined();
        expect(gltf.accessors[attributes.TANGENT]).toBeDefined();
        expect(gltf.accessors[attributes.BITANGENT]).toBeDefined();
        expect(byteLengthAfter).toBe(byteLengthBefore + 4 * 12 + 4 * 12); // 4 tangents and 4 bitangents are generated
    });

    it('does not generate tangents and bitangents if they already exist', function() {
        var gltf = {
            meshes: [{
                primitives: [{
                    attributes: {
                        POSITION: 0,
                        NORMAL: 1,
                        TEXCOORD_0: 2,
                        TANGENT: 3,
                        BITANGENT: 4
                    },
                    indices: 5,
                    mode: WebGLConstants.TRIANGLES
                }]
            }]
        };
        var gltfCopy = clone(gltf);
        generateTangentsBitangents(gltf);
        uninterleaveAndPackBuffers(gltf);
        expect(gltf.meshes).toEqual(gltfCopy.meshes);
    });

});
