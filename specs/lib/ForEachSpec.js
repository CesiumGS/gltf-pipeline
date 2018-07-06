'use strict';
var Cesium = require('cesium');
var ForEach = require('../../lib/ForEach');

var WebGLConstants = Cesium.WebGLConstants;

describe('ForEach', function() {
    var gltfAccessors = {
        accessors: [
            {
                componentType: WebGLConstants.UNSIGNED_SHORT,
                count: 3,
                type: 'SCALAR',
                bufferView: 0
            },
            {
                componentType: WebGLConstants.UNSIGNED_SHORT,
                count: 3,
                type: 'SCALAR',
                bufferView: 1
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 2
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 3
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 4
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 5
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 6
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 7
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 8
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 9
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 10
            },
            {
                componentType: WebGLConstants.FLOAT,
                count: 3,
                type: 'VEC3',
                bufferView: 11
            }
        ],
        meshes: [
            {
                primitives: [
                    {
                        attributes: {
                            POSITION: 2,
                            NORMAL: 3
                        },
                        indices: 0,
                        targets: [
                            {
                                POSITION: 4,
                                NORMAL: 5
                            },
                            {
                                POSITION: 6,
                                NORMAL: 7
                            }
                        ]
                    }
                ]
            },
            {
                primitives: [
                    {
                        attributes: {
                            POSITION: 8,
                            NORMAL: 9
                        },
                        indices: 1,
                        targets: [
                            {
                                POSITION: 10,
                                NORMAL: 11
                            }
                        ]
                    }
                ]
            }
        ]
    };

    it('loops over accessors', function() {
        ForEach.accessor(gltfAccessors, function(accessor, index) {
            expect(accessor.bufferView).toBe(index);
        });

        var returnValue = ForEach.accessor(gltfAccessors, function(accessor, index) {
            if (index === 1) {
                return accessor;
            }
        });

        expect(returnValue).toBe(gltfAccessors.accessors[1]);
    });

    it('loops over accessor with semantic', function() {
        var positionAccessorLength = 0;
        var returnValue = ForEach.accessorWithSemantic(gltfAccessors, 'POSITION', function(accessorId) {
            expect(gltfAccessors.accessors[accessorId].bufferView).toBe(accessorId);
            positionAccessorLength++;

            if (positionAccessorLength === 5) {
                return accessorId;
            }
        });
        expect(positionAccessorLength).toBe(5);
        expect(returnValue).toBe(10);
    });

    it('loops over accessors containing vertex data', function() {
        var vertexAccessorsLength = 0;
        var returnValue = ForEach.accessorContainingVertexAttributeData(gltfAccessors, function(accessorId) {
            expect(gltfAccessors.accessors[accessorId].bufferView).toBe(accessorId);
            vertexAccessorsLength++;

            if (vertexAccessorsLength === 10) {
                return accessorId;
            }
        });
        expect(vertexAccessorsLength).toBe(10);
        expect(returnValue).toBe(11);
    });

    it('loops over accessors containing index data', function() {
        var indicesAccessorsLength = 0;
        var returnValue = ForEach.accessorContainingIndexData(gltfAccessors, function(accessorId) {
            expect(gltfAccessors.accessors[accessorId].bufferView).toBe(accessorId);
            indicesAccessorsLength++;

            if (indicesAccessorsLength === 2) {
                return accessorId;
            }
        });
        expect(indicesAccessorsLength).toBe(2);
        expect(returnValue).toBe(1);
    });

    var gltfAnimations = {
        animations: [
            {
                channels: [
                    {
                        sampler: 0,
                        target: {
                            node: 0,
                            path: 'translation'
                        }
                    },
                    {
                        sampler: 1,
                        target: {
                            node: 0,
                            path: 'translation'
                        }
                    }
                ],
                samplers: [
                    {
                        input: 0,
                        output: 2
                    },
                    {
                        input: 1,
                        output: 3
                    }
                ]
            },
            {
                channels: [
                    {
                        sampler: 0,
                        target: {
                            node: 1,
                            path: 'translation'
                        }
                    }
                ],
                samplers: [
                    {
                        input: 4,
                        output: 5
                    }
                ]
            }
        ]
    };

    it('loops over animations', function() {
        var returnValue = ForEach.animation(gltfAnimations, function(animation, index) {
            expect(animation.channels[0].target.node).toBe(index);

            if (index === 1) {
                return animation;
            }
        });

        expect(returnValue).toBe(gltfAnimations.animations[1]);
    });

    it('loops over animation channel', function() {
        var returnValue = ForEach.animationChannel(gltfAnimations.animations[0], function(channel, index) {
            expect(channel.sampler).toBe(index);

            if (index === 1) {
                return channel;
            }
        });

        expect(returnValue).toBe(gltfAnimations.animations[0].channels[1]);
    });

    it('loops over animation samplers', function() {
        var returnValue = ForEach.animationSampler(gltfAnimations.animations[0], function(sampler, index) {
            expect(sampler.input).toBe(index);

            if (index === 1) {
                return sampler;
            }
        });

        expect(returnValue).toBe(gltfAnimations.animations[0].samplers[1]);
    });

    it('loops over buffers', function() {
        var gltf = {
            buffers : [
                {
                    uri: '0.bin',
                    byteLength: 10
                },
                {
                    uri: '1.bin',
                    byteLength: 10
                }
            ]
        };
        var returnValue = ForEach.buffer(gltf, function(buffer, index) {
            expect(buffer.uri).toBe(index + '.bin');
            if (index === 1) {
                return buffer;
            }
        });
        expect(returnValue).toBe(gltf.buffers[1]);
    });

    it('loops over buffers (gltf 1.0)', function() {
        var gltf = {
            buffers : {
                buffer0: {
                    uri: 'buffer0.bin'
                },
                buffer1: {
                    uri: 'buffer1.bin'
                }
            }
        };
        var returnValue = ForEach.buffer(gltf, function(buffer, name) {
            expect(buffer.uri).toBe(name + '.bin');
            if (name === '1.bin') {
                return buffer;
            }
        });
        expect(returnValue).toBe(gltf.buffers[1]);
    });

    it('loops over buffer views', function() {
        var gltf = {
            bufferViews: [
                {
                    buffer: 0,
                    byteLength: 10
                },
                {
                    buffer: 1,
                    byteLength: 10
                }
            ]
        };
        var returnValue = ForEach.bufferView(gltf, function(bufferView, index) {
            expect(bufferView.buffer).toBe(index);
            if (index === 1) {
                return bufferView;
            }
        });
        expect(returnValue).toBe(gltf.bufferViews[1]);
    });

    it('loops over cameras', function() {
        var gltf = {
            cameras : [
                {
                    perspective: {
                        yfov: 0.0,
                        znear: 0.0
                    }
                },
                {
                    perspective: {
                        yfov: 1.0,
                        znear: 1.0
                    }
                }
            ]
        };
        var returnValue = ForEach.camera(gltf, function(camera, index) {
            expect(camera.perspective.yfov).toBe(index);
            expect(camera.perspective.znear).toBe(index);
            if (index === 1) {
                return camera;
            }
        });
        expect(returnValue).toBe(gltf.cameras[1]);
    });

    it('loops over images', function() {
        var gltf = {
            images : [
                {
                    bufferView: 0
                },
                {
                    bufferView: 1
                }
            ]
        };
        var returnValue = ForEach.image(gltf, function(image, index) {
            expect(image.bufferView).toBe(index);
            if (index === 1) {
                return image;
            }
        });
        expect(returnValue).toBe(gltf.images[1]);
    });

    it('loops over images (gltf 1.0)', function() {
        var gltf = {
            images : {
                image0: {
                    uri: 'image0.png'
                },
                image1: {
                    uri: 'image1.png'
                }
            }
        };
        var returnValue = ForEach.image(gltf, function(image, name) {
            expect(image.uri).toBe(name + '.png');
            if (name === 'image1') {
                return image;
            }
        });
        expect(returnValue).toBe(gltf.images['image1']);
    });

    it('loops over compressed images', function() {
        var gltf = {
            images: [
                {
                    extras: {
                        compressedImage3DTiles: {
                            s3tc: {
                                uri: 's3tc.ktx'
                            },
                            etc1: {
                                uri: 'etc1.ktx'
                            }
                        }
                    }
                }
            ]
        };
        var returnValue = ForEach.compressedImage(gltf.images[0], function(compressedImage, type) {
            expect(compressedImage.uri).toBe(type + '.ktx');
            if (type === 'etc1') {
                return compressedImage;
            }
        });
        expect(returnValue).toBe(gltf.images[0].extras.compressedImage3DTiles['etc1']);
    });

    it('loops over materials', function() {
        var gltf = {
            materials: [
                {
                    emissiveTexture: 0
                },
                {
                    emissiveTexture: 1
                }
            ]
        };
        var returnValue = ForEach.material(gltf, function(material, index) {
            expect(material.emissiveTexture).toBe(index);
            if (index === 1) {
                return material;
            }
        });
        expect(returnValue).toBe(gltf.materials[1]);
    });

    it('loops over material values', function () {
        var material = {
            name: 'Texture',
            extensions: {
                KHR_techniques_webgl: {
                    technique: 0,
                    values: {
                        u_diffuse: {
                            index: 0
                        },
                        u_shininess: 256,
                        u_specular: [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
                }
            }
        };

        var count = 0;
        var returnValue = ForEach.materialValue(material, function (value, uniformName) {
            expect(value).toBeDefined();
            expect(uniformName.indexOf('u_')).toBe(0);
            count++;
            if (uniformName === 'u_specular') {
                return value;
            }
        });
        expect(count).toBe(3);
        expect(returnValue).toBe(material.extensions.KHR_techniques_webgl.values['u_specular']);
    });

    it('loops over legacy material values', function () {
        var material = {
            name: 'Texture',
            values: {
                diffuse: {
                    index: 0
                },
                shininess: 256,
                specular: [
                    0.2,
                    0.2,
                    0.2,
                    1
                ]
            }
        };

        var count = 0;
        var returnValue = ForEach.materialValue(material, function (value, materialId) {
            expect(value).toBeDefined();
            count++;
            if (materialId === 'specular') {
                return value;
            }
        });
        expect(count).toBe(3);
        expect(returnValue).toBe(material.values['specular']);
    });

    it('loops over meshes', function() {
        var gltf = {
            meshes: [
                {
                    primitives: [
                        {
                            attributes: {
                                POSITION: 0,
                                NORMAL: 2
                            }
                        }
                    ]
                },
                {
                    primitives: [
                        {
                            attributes: {
                                POSITION: 1,
                                NORMAL: 3
                            }
                        }
                    ]
                }
            ]
        };

        var returnValue = ForEach.mesh(gltf, function(mesh, index) {
            expect(mesh.primitives[0].attributes.POSITION).toBe(index);
            if (index === 1) {
                return mesh;
            }
        });
        expect(returnValue).toBe(gltf.meshes[1]);
    });

    var gltfPrimitives = {
        meshes: [
            {
                primitives: [
                    {
                        attributes: {
                            POSITION: 0,
                            NORMAL: 2
                        }
                    },
                    {
                        attributes: {
                            POSITION: 1,
                            NORMAL: 3
                        }
                    }
                ]
            }
        ]
    };

    it('loops over primitives', function() {
        var mesh = gltfPrimitives.meshes[0];
        var returnValue = ForEach.meshPrimitive(mesh, function(primitive, index) {
            expect(primitive.attributes.POSITION).toBe(index);
            if (index === 1) {
                return primitive;
            }
        });
        expect(returnValue).toBe(gltfPrimitives.meshes[0].primitives[1]);
    });

    it('loops over attributes', function() {
        var primitive = gltfPrimitives.meshes[0].primitives[0];
        var returnValue = ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
            expect(primitive.attributes[semantic]).toBe(accessorId);
            if (semantic === 'NORMAL') {
                return accessorId;
            }
        });
        expect(returnValue).toBe(gltfPrimitives.meshes[0].primitives[0].attributes['NORMAL']);
    });

    var gltfTargets = {
        meshes: [
            {
                primitives: [
                    {
                        attributes: {
                            POSITION: 4,
                            NORMAL: 5
                        },
                        targets: [
                            {
                                POSITION: 0,
                                NORMAL: 2
                            },
                            {
                                POSITION: 1,
                                NORMAL: 3
                            }
                        ]
                    }
                ]
            }
        ]
    };

    it('loops over targets', function() {
        var primitive = gltfTargets.meshes[0].primitives[0];
        var returnValue = ForEach.meshPrimitiveTarget(primitive, function(target, index) {
            expect(target.POSITION).toBe(index);
            if (index === 1) {
                return target;
            }
        });
        expect(returnValue).toBe(gltfTargets.meshes[0].primitives[0].targets[1]);
    });

    it('loops over target attributes', function() {
        var target = gltfTargets.meshes[0].primitives[0].targets[0];
        var returnValue = ForEach.meshPrimitiveTargetAttribute(target, function(accessorId, semantic) {
            expect(target[semantic]).toBe(accessorId);
            if (semantic === 'NORMAL') {
                return accessorId;
            }
        });
        expect(returnValue).toBe(gltfTargets.meshes[0].primitives[0].targets[0]['NORMAL']);
    });

    var gltfNodes = {
        nodes: [
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
                children: [4, 5]
            },
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]
            },
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 2.0, 0.0, 0.0, 1.0]
            },
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 3.0, 0.0, 0.0, 1.0]
            },
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 4.0, 0.0, 0.0, 1.0]
            },
            {
                matrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 5.0, 0.0, 0.0, 1.0]
            }
        ],
        scenes: [
            {
                nodes: [0, 1, 2]
            },
            {
                nodes: [3]
            }
        ]
    };

    it('loops over nodes', function() {
        var nodesLength = 0;

        var returnValue = ForEach.node(gltfNodes, function(node, index) {
            expect(node.matrix[12]).toBe(index);
            nodesLength++;

            if (nodesLength === 6) {
                return node;
            }
        });

        expect(nodesLength).toBe(6);
        expect(returnValue).toBe(gltfNodes.nodes[5]);
    });

    it('loops over nodes in tree', function() {
        var nodesInTree = 0;

        var returnValue = ForEach.nodeInTree(gltfNodes, gltfNodes.scenes[0].nodes, function(node, index) {
            expect(node.matrix[12]).toBe(index);
            nodesInTree++;

            if (nodesInTree === 5) {
                return node;
            }
        });

        expect(nodesInTree).toBe(5);
        expect(returnValue).toBe(gltfNodes.nodes[2]);
    });

    it('loops over nodes in scene', function() {
        var nodesInScene0 = 0;
        var nodesInScene1 = 0;

        ForEach.nodeInScene(gltfNodes, gltfNodes.scenes[0], function(node, index) {
            expect(node.matrix[12]).toBe(index);
            nodesInScene0++;
        });
        var returnValue = ForEach.nodeInScene(gltfNodes, gltfNodes.scenes[1], function(node, index) {
            expect(node.matrix[12]).toBe(index);
            nodesInScene1++;

            if (nodesInScene1 === 1) {
                return node;
            }
        });

        expect(nodesInScene0).toBe(5);
        expect(nodesInScene1).toBe(1);
        expect(returnValue).toBe(gltfNodes.nodes[3]);
    });

    it('loops over samplers', function() {
        var filters = [WebGLConstants.NEAREST, WebGLConstants.LINEAR];
        var gltf = {
            samplers: [
                {
                    magFilter: filters[0],
                    minFilter: filters[0]
                },
                {
                    magFilter: filters[1],
                    minFilter: filters[1]
                }
            ]
        };
        var count = 0;
        var returnValue = ForEach.sampler(gltf, function(sampler, index) {
            expect(sampler.magFilter).toBe(filters[index]);
            expect(sampler.minFilter).toBe(filters[index]);
            expect(index).toBe(count++);

            if (index === 1) {
                return sampler;
            }
        });

        expect(returnValue).toBe(gltf.samplers[1]);
    });

    it('loops over scenes', function() {
        var gltf = {
            scenes: [
                {
                    nodes: [0]
                },
                {
                    nodes: [1]
                }
            ]
        };
        var returnValue = ForEach.scene(gltf, function(scene, index) {
            expect(scene.nodes[0]).toBe(index);

            if (index === 1) {
                return scene;
            }
        });
        expect(returnValue).toBe(gltf.scenes[1]);
    });

    it('loops over shaders (gltf 1.0)', function() {
        var gltf = {
            shaders : {
                vert: {
                    type: WebGLConstants.VERTEX_SHADER,
                    uri: 'vert.glsl'
                },
                frag: {
                    type: WebGLConstants.FRAGMENT_SHADER,
                    uri: 'frag.glsl'
                }
            }
        };
        var returnValue = ForEach.shader(gltf, function(shader, name) {
            expect(shader.uri).toBe(name + '.glsl');

            if (name === 'frag') {
                return shader;
            }
        });

        expect(returnValue).toBe(gltf.shaders['frag']);
    });

    it('loops over KHR_techniques_webgl shaders (gltf 2.0)', function () {
        var gltf = {
            extensions: {
                KHR_techniques_webgl: {
                    shaders: [
                        {
                            type: WebGLConstants.FRAGMENT_SHADER,
                            name: 'BoxTextured0FS',
                            uri: 'BoxTextured0FS.glsl'
                        },
                        {
                            type: WebGLConstants.VERTEX_SHADER,
                            name: 'BoxTextured0VS',
                            uri: 'BoxTextured0VS.glsl'
                        }
                    ]
                }
            },
            extensionsUsed: ['KHR_techniques_webgl']
        };

        var count = 0;
        var returnValue = ForEach.shader(gltf, function (shader) {
            expect(shader.uri).toBe(shader.name + '.glsl');
            count++;

            if (count === 2) {
                return shader;
            }
        });
        expect(count).toBe(2);
        expect(returnValue).toBe(gltf.extensions.KHR_techniques_webgl.shaders[1]);

        gltf = {};

        count = 0;
        ForEach.shader(gltf, function () {
            count++;
        });
        expect(count).toBe(0);
    });

    it('loops over KHR_techniques_webgl programs (gltf 2.0)', function () {
        var gltf = {
            extensions: {
                KHR_techniques_webgl: {
                    programs: [
                        {
                            name: 'program_0',
                            fragmentShader: 0,
                            vertexShader: 1
                        },
                        {
                            name: 'program_1',
                            fragmentShader: 2,
                            vertexShader: 3
                        }
                    ]
                }
            },
            extensionsUsed: ['KHR_techniques_webgl']
        };

        var count = 0;
        var returnValue = ForEach.program(gltf, function (program) {
            expect(program.fragmentShader).toBeDefined();
            expect(program.vertexShader).toBeDefined();
            count++;

            if (count === 2) {
                return program;
            }
        });
        expect(count).toBe(2);
        expect(returnValue).toBe(gltf.extensions.KHR_techniques_webgl.programs[1]);

        gltf = {};

        count = 0;
        ForEach.program(gltf, function () {
            count++;
        });
        expect(count).toBe(0);
    });

    it('loops over legacy programs (gltf 1.0)', function () {
        var gltf = {
            programs: {
                program_0: {
                    fragmentShader: 0,
                    vertexShader: 1
                },
                program_1: {
                    fragmentShader: 2,
                    vertexShader: 3
                }
            }
        };

        var count = 0;
        var returnValue = ForEach.program(gltf, function (program) {
            expect(program.fragmentShader).toBeDefined();
            expect(program.vertexShader).toBeDefined();
            count++;

            if (count === 2) {
                return program;
            }
        });
        expect(count).toBe(2);
        expect(returnValue).toBe(gltf.programs['program_1']);
    });

    it('loops over KHR_techniques_webgl techniques (gltf 2.0)', function () {
        var gltf = {
            extensions: {
                KHR_techniques_webgl: {
                    techniques: [
                        {
                            name: 'technique0',
                            program: 0,
                            attributes: {},
                            uniforms: {}
                        },
                        {
                            name: 'technique1',
                            program: 1,
                            attributes: {},
                            uniforms: {}
                        }
                    ]
                }
            },
            extensionsUsed: ['KHR_techniques_webgl']
        };

        var count = 0;
        var returnValue = ForEach.technique(gltf, function (technique, index) {
            expect(technique.name).toBe('technique' + index);
            count++;

            if (count === 2) {
                return technique;
            }
        });
        expect(count).toBe(2);
        expect(returnValue).toBe(gltf.extensions.KHR_techniques_webgl.techniques[1]);

        gltf = {};

        count = 0;
        ForEach.technique(gltf, function () {
            count++;
        });
        expect(count).toBe(0);
    });

    it('loops over legacy techniques (gltf 1.0)', function () {
        var gltf = {
            techniques: {
                technique0: {
                    program: 0,
                    attributes: {},
                    uniforms: {}
                },
                technique1: {
                    program: 1,
                    attributes: {},
                    uniforms: {}
                }
            }
        };

        var count = 0;
        var returnValue = ForEach.technique(gltf, function (technique) {
            expect(technique.program).toBeDefined();
            count++;

            if (count === 2) {
                return technique;
            }
        });
        expect(count).toBe(2);
        expect(returnValue).toBe(gltf.techniques['technique1']);
    });

    it('loops over technique attributes', function () {
        var technique = {
            name: 'technique0',
            program: 0,
            attributes: {
                a_normal: {
                    semantic: 'NORMAL'
                },
                a_position: {
                    semantic: 'POSITION'
                },
                a_texcoord0: {
                    semantic: 'TEXCOORD_0'
                }
            },
            uniforms: {}
        };

        var count = 0;
        var returnValue = ForEach.techniqueAttribute(technique, function (attribute, attributeName) {
            expect(attribute.semantic).toBeDefined();
            expect(attributeName.indexOf('a_')).toBe(0);
            count++;

            if (count === 3) {
                return attribute;
            }
        });

        expect(count).toBe(3);
        expect(returnValue).toBe(technique.attributes['a_texcoord0']);
    });

    it('loops over legacy technique attributes', function () {
        var technique = {
            name: 'technique0',
            program: 0,
            parameters: {},
            attributes: {
                a_normal: 'normal',
                a_position: 'position',
                a_texcoord0: 'texcoord0'
            },
            uniforms: {}
        };

        var count = 0;
        var returnValue = ForEach.techniqueAttribute(technique, function (parameterName, attributeName) {
            expect(parameterName).toBe(attributeName.substring(2));
            count++;

            if (count === 3) {
                return parameterName;
            }
        });

        expect(count).toBe(3);
        expect(returnValue).toBe(technique.attributes['a_texcoord0']);
    });

    it('loops over technique uniforms', function () {
        var technique = {
            name: 'technique0',
            program: 0,
            attributes: {},
            uniforms: {
                u_diffuse: {
                    type: WebGLConstants.SAMPLER_2D
                },
                u_modelViewMatrix: {
                    type: WebGLConstants.FLOAT_MAT4,
                    semantic: 'MODELVIEW'
                },
                u_normalMatrix: {
                    type: WebGLConstants.FLOAT_MAT3,
                    semantic: 'MODELVIEWINVERSETRANSPOSE'
                }
            }
        };

        var count = 0;
        var returnValue = ForEach.techniqueUniform(technique, function (uniform, uniformName) {
            expect(uniform.type).toBeDefined();
            expect(uniformName.indexOf('u_')).toBe(0);
            count++;

            if (count === 3) {
                return uniform;
            }
        });

        expect(count).toBe(3);
        expect(returnValue).toBe(technique.uniforms['u_normalMatrix']);
    });

    it('loops over legacy technique uniforms', function () {
        var technique = {
            name: 'technique0',
            program: 0,
            parameters: {},
            attributes: {},
            uniforms: {
                u_diffuse: 'diffuse',
                u_modelViewMatrix: 'modelViewMatrix',
                u_normalMatrix: 'normalMatrix'
            }
        };

        var count = 0;
        var returnValue = ForEach.techniqueUniform(technique, function (parameterName, uniformName) {
            expect(parameterName).toBe(uniformName.substring(2));
            count++;

            if (count === 3) {
                return parameterName;
            }
        });

        expect(count).toBe(3);
        expect(returnValue).toBe(technique.uniforms['u_normalMatrix']);
    });

    it('loops over legacy technique parameters', function () {
        var technique = {
            name: 'technique0',
            program: 0,
            attributes: {},
            uniforms: {},
            parameters: {
                diffuse: {
                    type: WebGLConstants.SAMPLER_2D
                },
                modelViewMatrix: {
                    semantic: 'MODELVIEW',
                    type: WebGLConstants.FLOAT_MAT4
                },
                normal: {
                    semantic: 'NORMAL',
                    type: WebGLConstants.FLOAT_VEC3
                }
            }
        };

        var count = 0;
        var returnValue = ForEach.techniqueParameter(technique, function (parameter, parameterName) {
            expect(parameter.type).toBeDefined();
            expect(parameterName).toBeDefined();
            count++;

            if (count === 3) {
                return parameter;
            }
        });

        expect(count).toBe(3);
        expect(returnValue).toBe(technique.parameters['normal']);
    });

    it('loops over each skin', function() {
        var gltf = {
            skins: [
                {
                    joints: [0]
                },
                {
                    joints: [1]
                }
            ]
        };
        var returnValue = ForEach.skin(gltf, function(skin, index) {
            expect(skin.joints[0]).toBe(index);

            if (index === 1) {
                return skin;
            }
        });
        expect(returnValue).toBe(gltf.skins[1]);
    });

    it('loops over each texture', function() {
        var gltf = {
            textures: [
                {
                    source: 0
                },
                {
                    source: 1
                }
            ]
        };
        var returnValue = ForEach.texture(gltf, function(texture, index) {
            expect(texture.source).toBe(index);

            if (index === 1) {
                return texture;
            }
        });
        expect(returnValue).toBe(gltf.textures[1]);
    });
});
