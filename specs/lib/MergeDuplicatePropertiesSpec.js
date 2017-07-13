'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var MergeDuplicateProperties = require('../../lib/MergeDuplicateProperties');

var WebGLConstants = Cesium.WebGLConstants;

describe('MergeDuplicateProperties', function() {
    var mergeAccessors = MergeDuplicateProperties.mergeAccessors;
    describe('mergeAccessors', function() {
        var testGltf = {
            accessors: [
                {
                    bufferView: 0,
                    byteOffset: 0,
                    componentType: WebGLConstants.BYTE,
                    count: 3,
                    type: 'SCALAR'
                }, {
                    bufferView: 0,
                    byteOffset: 3,
                    componentType: WebGLConstants.BYTE,
                    count: 3,
                    type: 'SCALAR'
                }
            ],
            bufferViews: [
                {
                    buffer: 0,
                    byteOffset: 0
                }
            ],
            buffers: [
                {
                    extras : {
                        _pipeline : {}
                    }
                }
            ],
            meshes: [
                {
                    primitives : [
                        {
                            attributes: {
                                TEST: 0
                            }
                        }
                    ]
                }, {
                    primitives : [
                        {
                            attributes: {
                                TEST: 1
                            }
                        }
                    ]
                }
            ]
        };
        it('merges a single duplicate accessor', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers[0];
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews[0].byteLength = buffer.length;
            mergeAccessors(gltf);
            expect(gltf.accessors.length).toEqual(1);
            expect(gltf.meshes[0].primitives[0].attributes.TEST).toEqual(gltf.meshes[1].primitives[0].attributes.TEST);
        });

        it ('merges multiple duplicate accessors', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3, 1, 2, 3]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers[0];
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews[0].byteLength = buffer.length;
            gltf.accessors.push({
                bufferView: 0,
                byteOffset: 6,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            });
            gltf.meshes.push({
                primitives : [
                    {
                        attributes : {
                            TEST: 2
                        }
                    }
                ]
            });
            mergeAccessors(gltf);
            expect(gltf.accessors.length).toEqual(1);
            expect(gltf.meshes[0].primitives[0].attributes.TEST).toEqual(gltf.meshes[1].primitives[0].attributes.TEST);
            expect(gltf.meshes[0].primitives[0].attributes.TEST).toEqual(gltf.meshes[2].primitives[0].attributes.TEST);
        });

        it ('leaves a non-duplicate accessor alone', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3, 3, 2, 1]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers[0];
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews[0].byteLength = buffer.length;
            gltf.accessors.push({
                bufferView: 0,
                byteOffset: 6,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            });
            gltf.meshes.push({
                primitives : [
                    {
                        attributes : {
                            TEST: 2
                        }
                    }
                ]

            });
            mergeAccessors(gltf);
            expect(gltf.accessors.length).toEqual(2);
            expect(gltf.meshes[0].primitives[0].attributes.TEST).toEqual(gltf.meshes[1].primitives[0].attributes.TEST);
            expect(gltf.meshes[0].primitives[0].attributes.TEST).not.toEqual(gltf.meshes[2].primitives[0].attributes.TEST);
        });
    });

    var mergeShaders = MergeDuplicateProperties.mergeShaders;
    describe('mergeShaders', function() {
        it('merges duplicate shaders', function() {
            var gltf = {
                programs : [
                    {
                        fragmentShader : 1,
                        vertexShader : 0
                    }, {
                        fragmentShader : 3,
                        vertexShader : 2
                    }
                ],
                shaders : [
                    {
                        type : WebGLConstants.VERTEX_SHADER,
                        extras : {
                            _pipeline : {
                                source : 'test shader one'
                            }
                        }
                    }, {
                        type : WebGLConstants.FRAGMENT_SHADER,
                        extras : {
                            _pipeline : {
                                source : 'test shader one'
                            }
                        }
                    }, {
                        type : WebGLConstants.VERTEX_SHADER,
                        extras : {
                            _pipeline : {
                                source : 'test shader two'
                            }
                        }
                    }, {
                        type : WebGLConstants.FRAGMENT_SHADER,
                        extras : {
                            _pipeline : {
                                source : 'test shader one'
                            }
                        }
                    }
                ]
            };
            mergeShaders(gltf);
            var programs = gltf.programs;
            expect(programs[0].fragmentShader).toBe(1);
            expect(programs[0].vertexShader).toBe(0);
            expect(programs[1].fragmentShader).toBe(1);
            expect(programs[1].vertexShader).toBe(2);
        });
    });

    var mergePrograms = MergeDuplicateProperties.mergePrograms;
    describe('mergePrograms', function() {
        it('merges duplicate programs', function() {
            var gltf = {
                programs: [
                    {
                        fragmentShader: 0,
                        vertexShader: 1
                    }, {
                        fragmentShader: 0,
                        vertexShader: 1
                    }, {
                        fragmentShader: 0,
                        vertexShader: 2
                    }
                ],
                techniques: [
                    {
                        program: 0
                    },
                    {
                        program: 1
                    },
                    {
                        program: 2
                    }
                ]
            };
            mergePrograms(gltf);
            var techniques = gltf.techniques;
            expect(techniques[0].program).toBe(0);
            expect(techniques[1].program).toBe(0);
            expect(techniques[2].program).toBe(2);
        });
    });

    var mergeTechniques = MergeDuplicateProperties.mergeTechniques;
    describe('mergeTechniques', function() {
        it('merges duplicate techniques', function() {
            var gltf = {
                techniques : [
                    {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    {
                        key : 'value',
                        arrayOf : ['different', 'values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    }
                ],
                materials : [
                    {
                        technique : 0
                    }, {
                        technique : 1
                    }, {
                        technique : 2
                    }
                ]
            };
            mergeTechniques(gltf);
            var materials = gltf.materials;
            expect(materials[0].technique).toBe(0);
            expect(materials[1].technique).toBe(1);
            expect(materials[2].technique).toBe(0);
        });
    });

    var mergeMaterials = MergeDuplicateProperties.mergeMaterials;
    describe('mergeMaterials', function() {
        it('merges duplicate materials', function() {
            var gltf = {
                meshes : [
                    {
                        primitives : [
                            {
                                material : 0
                            },
                            {
                                material : 2
                            }
                        ]
                    }, {
                        primitives : [
                            {
                                material : 1
                            },
                            {
                                material : 2
                            }
                        ]
                    }
                ],
                materials : [
                    {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    }, {
                        key : 'value',
                        arrayOf : ['different', 'values'],
                        nested : {
                            key : 'value'
                        }
                    }, {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    }
                ]
            };
            mergeMaterials(gltf);
            var meshes = gltf.meshes;
            var meshOne = meshes[0];
            var meshOnePrimitives = meshOne.primitives;
            expect(meshOnePrimitives[0].material).toBe(0);
            expect(meshOnePrimitives[1].material).toBe(0);
            var meshTwo = meshes[1];
            var meshTwoPrimitives = meshTwo.primitives;
            expect(meshTwoPrimitives[0].material).toBe(1);
            expect(meshTwoPrimitives[1].material).toBe(0);
        });
    });
});