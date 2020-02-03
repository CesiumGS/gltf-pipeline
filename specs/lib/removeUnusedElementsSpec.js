'use strict';
const Cesium = require('cesium');
const ForEach = require('../../lib/ForEach');
const removeUnusedElements = require('../../lib/removeUnusedElements');

const WebGLConstants = Cesium.WebGLConstants;

const gltf = {
    nodes: [
        {
            name: 'skin',
            skin: 0,
            mesh: 0,
            translation: [0.0, 0.0, 0.0]
        },
        {
            name: 'used',
            mesh: 0,
            children: [2, 5]
        },
        {
            name: 'unused'
        },
        {
            name: 'nodeWithEmptyMesh',
            mesh: 1
        },
        {
            name: 'unusedParent',
            children: [2]
        },
        {
            name: 'camera',
            camera: 0
        },
        {
            name: 'light',
            extensions : {
                KHR_lights_punctual : {
                    light : 0
                }
            }
        }
    ],
    buffers: [
        {
            name: 'mesh',
            byteLength: 246,
            uri: 'data0.bin'
        },
        {
            name: 'other',
            byteLength: 80,
            uri: 'data1.bin'
        },
        {
            name: 'image01',
            byteLength: 1000,
            uri: 'data2.bin'
        },
        {
            image: 'image2',
            byteLength: 500,
            uri: 'data3.bin'
        }
    ],
    bufferViews: [
        {
            name: 'positions',
            buffer: 0,
            byteOffset: 0,
            byteLength: 36
        },
        {
            name: 'normals',
            buffer: 0,
            byteOffset: 36,
            byteLength: 36
        },
        {
            name: 'texcoords',
            buffer: 0,
            byteOffset: 72,
            byteLength: 24
        },
        {
            name: 'positions-target0',
            buffer: 0,
            byteOffset: 96,
            byteLength: 36
        },
        {
            name: 'normals-target0',
            buffer: 0,
            byteOffset: 132,
            byteLength: 36
        },
        {
            name: 'positions-target1',
            buffer: 0,
            byteOffset: 168,
            byteLength: 36
        },
        {
            name: 'normals-target1',
            buffer: 0,
            byteOffset: 204,
            byteLength: 36
        },
        {
            name: 'indices',
            buffer: 0,
            byteOffset: 240,
            byteLength: 6
        },
        {
            name: 'other',
            buffer: 1,
            byteOffset: 0,
            byteLength: 80
        },
        {
            name: 'image0',
            buffer: 2,
            byteOffset: 0,
            byteLength: 500
        },
        {
            name: 'image1',
            buffer: 2,
            byteOffset: 500,
            byteLength: 500
        },
        {
            name: 'image2',
            buffer: 3,
            byteOffset: 1000,
            byteLength: 500
        }
    ],
    accessors: [
        {
            name: 'positions',
            bufferView: 0,
            byteOffset: 0,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3',
            min: [-1.0, -1.0, -1.0],
            max: [1.0, 1.0, 1.0]
        },
        {
            name: 'normals',
            bufferView: 1,
            byteOffset: 36,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3'
        },
        {
            name: 'texcoords',
            bufferView: 2,
            byteOffset: 72,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC2'
        },
        {
            name: 'positions-target0',
            bufferView: 3,
            byteOffset: 96,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3',
            min: [-1.0, -1.0, -1.0],
            max: [1.0, 1.0, 1.0]
        },
        {
            name: 'normals-target0',
            bufferView: 4,
            byteOffset: 132,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3'
        },
        {
            name: 'positions-target1',
            bufferView: 5,
            byteOffset: 168,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3',
            min: [-1.0, -1.0, -1.0],
            max: [1.0, 1.0, 1.0]
        },
        {
            name: 'normals-target1',
            bufferView: 6,
            byteOffset: 204,
            componentType: WebGLConstants.FLOAT,
            count: 3,
            type: 'VEC3'
        },
        {
            name: 'indices',
            bufferView: 7,
            byteOffset: 240,
            componentType: WebGLConstants.UNSIGNED_SHORT,
            count: 3,
            type: 'SCALAR'
        },
        {
            name: 'bone-matrix',
            bufferView: 8,
            byteOffset: 0,
            componentType: WebGLConstants.FLOAT,
            count: 1,
            type: 'MAT4'
        },
        {
            name: 'times',
            bufferView: 8,
            byteOffset: 64,
            componentType: WebGLConstants.FLOAT,
            count: 1,
            type: 'SCALAR'
        },
        {
            name: 'translations',
            bufferView: 8,
            byteOffset: 68,
            componentType: WebGLConstants.FLOAT,
            count: 1,
            type: 'VEC3'
        }
    ],
    meshes: [
        {
            name: 'mesh0',
            primitives: [
                {
                    attributes: {
                        POSITION: 0,
                        NORMAL: 1,
                        TEXCOORD_0: 2
                    },
                    targets: [
                        {
                            POSITION: 3,
                            NORMAL: 4
                        },
                        {
                            POSITION: 5,
                            NORMAL: 6
                        }
                    ],
                    indices: 7,
                    mode: WebGLConstants.TRIANGLES,
                    material: 1
                }
            ]
        },
        {
            name: 'mesh1',
            primitives: []
        }
    ],
    cameras: [
        {
            name: 'cam',
            type: 'perspective'
        }
    ],
    skins: [
        {
            inverseBindMatrices: 8,
            joints: [0]
        }
    ],
    animations: [
        {
            channels: [
                {
                    sampler: 0,
                    target: {
                        node: 0,
                        path: 'translation'
                    }
                }
            ],
            samplers: [
                {
                    input: 9,
                    output: 10
                }
            ]
        }
    ],
    textures: [
        {
            'sampler': 0,
            'source': 1
        }
    ],
    images: [
        {
            bufferView: 9,
            mimeType: 'image/png'
        },
        {
            bufferView: 10,
            mimeType: 'image/png'
        },
        {
            bufferView: 11,
            mimeType: 'image/png'
        }
    ],
    extensions: {
        KHR_lights_punctual : {
            lights: [
                {
                    name: 'sun',
                    type: 'directional'
                }
            ]
        }
    },
    samplers: [
        {
            magFilter: 9729,
            minFilter: 9987,
            wrapS: 33648,
            wrapt: 33648
        },
        {
            magFilter: 9729,
            minFilter: 9987,
            wrapS: 33648,
            wrapt: 33648
        }
    ],
    materials: [
        {
            name: 'unused'
        },
        {
            name: 'used',
            pbrMetallicRoughness: {
                baseColorTexture: {
                    index: 0
                }
            }
        }
    ],
    scenes: [
        {
            nodes: [2, 3]
        }
    ]
};

describe('removeUnusedElements', () => {
    delete gltf.animations;
    delete gltf.skins;
    gltf.meshes[0].primitives[0].targets.splice(0, 1);
    gltf.images.splice(1, 2);
    removeUnusedElements(gltf);

    const remainingAccessorNames = ['positions', 'normals', 'texcoords', 'positions-target1', 'normals-target1', 'indices'];
    const remainingAcessorBufferViewIds = [0, 1, 2, 3, 4, 5];
    const remainingBufferViewNames = ['positions', 'normals', 'texcoords', 'positions-target1', 'normals-target1', 'indices', 'image0'];
    const remainingBufferViewBufferIds = [0, 0, 0, 0, 0, 0, 1];

    const remaining = {
        nodes: ['skin', 'used', 'camera', 'light'],
        cameras: ['cam'],
        meshes: ['mesh0'],
        buffers: ['mesh', 'image01'],
        lights: ['sun'],
        materials: ['used']
    };

    it('correctly removes/keeps accessors', () => {
        expect(gltf.accessors.length).toBe(remainingAccessorNames.length);

        ForEach.accessor(gltf, (accessor, index) => {
            expect(accessor.name).toBe(remainingAccessorNames[index]);
            expect(accessor.bufferView).toBe(remainingAcessorBufferViewIds[index]);
        });
    });

    it('correctly removes/keeps bufferViews', () => {
        expect(gltf.bufferViews.length).toBe(remainingBufferViewNames.length);

        ForEach.bufferView(gltf, (bufferView, index) => {
            expect(bufferView.name).toBe(remainingBufferViewNames[index]);
            expect(bufferView.buffer).toBe(remainingBufferViewBufferIds[index]);
        });
    });

    ['materials', 'nodes', 'cameras', 'meshes', 'buffers'].forEach(k => {
        it('correctly removes/keeps ' + k, () => {
            expect(Object.keys(gltf)).toContain(k);
            expect(gltf[k].length).toBe(remaining[k].length);

            // Check that at least the remaining elements are present
            ForEach.topLevel(gltf, k, (element) => {
                expect(remaining[k]).toContain(element.name);
            });

            // Check that all the elements should actually remain
            remaining[k].forEach((name) => {
                expect(gltf[k].map(x => x.name)).toContain(name);
            });
        });
    });

    it('correctly removes/keeps textures', () => {
        expect(gltf.textures.length).toBe(1);
    });

    it('correctly removes/keeps samplers', () => {
        expect(gltf.samplers.length).toBe(1);
    });

    it('correctly removes/keeps images', () => {
        expect(gltf.samplers.length).toBe(1);
    });

    it('correctly removes/keeps lights', () => {
        expect(Object.keys(gltf)).toContain('extensions');
        expect(Object.keys(gltf.extensions)).toContain('KHR_lights_punctual');
        expect(Object.keys(gltf.extensions.KHR_lights_punctual)).toContain('lights');

        expect(gltf.extensions.KHR_lights_punctual.lights.length)
            .toBe(remaining.lights.length);

        gltf.extensions.KHR_lights_punctual.lights.forEach((element, index) => {
            expect(remaining['lights']).toContain(element.name);
        });
    });
});
