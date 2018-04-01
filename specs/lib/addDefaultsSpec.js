'use strict';
var Cesium = require('cesium');
var addDefaults = require('../../lib/addDefaults');

var WebGLConstants = Cesium.WebGLConstants;

describe('addDefaults', function() {
    it('adds mesh, accessor, and bufferView defaults', function() {
        var gltf = {
            meshes : [
                {
                    primitives : [
                        {
                            attributes : {
                                POSITION : 0
                            },
                            indices : 2,
                            targets : [
                                {
                                    POSITION : 1
                                }
                            ]
                        }
                    ]
                }
            ],
            accessors : [
                {
                    bufferView : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : 24,
                    type : 'VEC3',
                    min : [-1.0, -1.0, -1.0],
                    max : [1.0, 1.0, 1.0]
                },
                {
                    bufferView : 1,
                    componentType : WebGLConstants.FLOAT,
                    count : 24,
                    type : 'VEC3',
                    min : [-1.0, -1.0, -1.0],
                    max : [1.0, 1.0, 1.0]
                },
                {
                    bufferView : 2,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : 36,
                    type : 'SCALAR',
                    min : [0],
                    max : [24]
                }
            ],
            bufferViews : [
                {
                    buffer : 0,
                    byteLength : 288
                },
                {
                    buffer : 0,
                    byteLength : 288,
                    byteOffset : 288
                },
                {
                    buffer : 0,
                    byteLength : 72,
                    byteOffset : 576
                },
                {
                    buffer : 0,
                    byteLength : 10,
                    byteOffset : 648
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        var primitive = gltfWithDefaults.meshes[0].primitives[0];
        var positionAccessor = gltfWithDefaults.accessors[0];
        var positionTargetAccessor = gltfWithDefaults.accessors[1];
        var indicesAccessor = gltfWithDefaults.accessors[2];
        var positionBufferView = gltfWithDefaults.bufferViews[0];
        var positionTargetBufferView = gltfWithDefaults.bufferViews[1];
        var indicesBufferView = gltfWithDefaults.bufferViews[2];
        var otherBufferView = gltfWithDefaults.bufferViews[3];

        expect(primitive.mode).toBe(WebGLConstants.TRIANGLES);

        expect(positionAccessor.byteOffset).toBe(0);
        expect(positionAccessor.normalized).toBe(false);
        expect(positionBufferView.byteOffset).toBe(0);
        expect(positionBufferView.byteStride).toBe(12);
        expect(positionBufferView.target).toBe(WebGLConstants.ARRAY_BUFFER);

        expect(positionTargetAccessor.byteOffset).toBe(0);
        expect(positionTargetAccessor.normalized).toBe(false);
        expect(positionTargetBufferView.byteStride).toBe(12);

        expect(indicesAccessor.byteOffset).toBe(0);
        expect(indicesAccessor.normalized).toBeUndefined();
        expect(indicesBufferView.byteStride).toBeUndefined();
        expect(indicesBufferView.target).toBe(WebGLConstants.ELEMENT_ARRAY_BUFFER);

        expect(otherBufferView.target).toBeUndefined();
    });

    it('adds material defaults', function() {
        var gltf = {
            materials : [
                {
                    emissiveTexture : {
                        index : 0
                    },
                    normalTexture : {
                        index : 1
                    },
                    occlusionTexture : {
                        index : 2
                    }
                },
                {
                    alphaMode : 'MASK'
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        var materialOpaque = gltfWithDefaults.materials[0];
        var materialAlphaMask = gltfWithDefaults.materials[1];

        expect(materialOpaque.emissiveFactor).toEqual([0.0, 0.0, 0.0]);
        expect(materialOpaque.alphaMode).toBe('OPAQUE');
        expect(materialOpaque.doubleSided).toBe(false);
        expect(materialOpaque.emissiveTexture.texCoord).toBe(0);
        expect(materialOpaque.normalTexture.texCoord).toBe(0);
        expect(materialOpaque.occlusionTexture.texCoord).toBe(0);

        expect(materialAlphaMask.alphaCutoff).toBe(0.5);
    });

    it('adds metallic roughness defaults', function() {
        var gltf = {
            materials : [
                {
                    pbrMetallicRoughness : {
                        baseColorTexture : {
                            index : 0
                        },
                        metallicRoughnessTexture : {
                            index : 1
                        }
                    }
                }
            ]
        };
        var gltfWithDefaults = addDefaults(gltf);
        var pbrMetallicRoughness = gltfWithDefaults.materials[0].pbrMetallicRoughness;

        expect(pbrMetallicRoughness.baseColorFactor).toEqual([1.0, 1.0, 1.0, 1.0]);
        expect(pbrMetallicRoughness.metallicFactor).toBe(1.0);
        expect(pbrMetallicRoughness.roughnessFactor).toBe(1.0);
        expect(pbrMetallicRoughness.baseColorTexture.texCoord).toBe(0);
        expect(pbrMetallicRoughness.metallicRoughnessTexture.texCoord).toBe(0);
    });

    it('adds spec gloss defaults', function() {
        var gltf = {
            materials : [
                {
                    extensions : {
                        pbrSpecularGlossiness : {
                            specularGlossinessTexture : {
                                index : 0
                            }
                        }
                    }
                }
            ]
        };
        var gltfWithDefaults = addDefaults(gltf);
        var pbrSpecularGlossiness = gltfWithDefaults.materials[0].extensions.pbrSpecularGlossiness;

        expect(pbrSpecularGlossiness.diffuseFactor).toEqual([1.0, 1.0, 1.0, 1.0]);
        expect(pbrSpecularGlossiness.specularFactor).toEqual([1.0, 1.0, 1.0]);
        expect(pbrSpecularGlossiness.glossinessFactor).toBe(1.0);
        expect(pbrSpecularGlossiness.specularGlossinessTexture.texCoord).toBe(0);
    });

    it('adds materials common defaults', function() {
        var gltf = {
            materials : [
                {
                    extensions : {
                        KHR_materials_common : {
                            technique : 'BLINN'
                        }
                    }
                },
                {
                    extensions : {
                        KHR_materials_common : {
                            technique : 'CONSTANT'
                        }
                    }
                },
                {
                    extensions : {
                        KHR_materials_common : {
                            technique : 'LAMBERT'
                        }
                    }
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        var materialsCommonBlinn = gltfWithDefaults.materials[0].extensions.KHR_materials_common.values;
        var materialsCommonConstant = gltfWithDefaults.materials[1].extensions.KHR_materials_common.values;
        var materialsCommonLambert = gltfWithDefaults.materials[2].extensions.KHR_materials_common.values;

        expect(materialsCommonBlinn.ambient).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(materialsCommonBlinn.diffuse).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(materialsCommonBlinn.emission).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(materialsCommonBlinn.specular).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(materialsCommonBlinn.shininess).toBe(0.0);
        expect(materialsCommonBlinn.transparency).toBe(1.0);
        expect(materialsCommonBlinn.transparent).toBe(false);
        expect(materialsCommonBlinn.doubleSided).toBe(false);

        expect(materialsCommonConstant.diffuse).toBeUndefined();
        expect(materialsCommonConstant.specular).toBeUndefined();
        expect(materialsCommonConstant.shininess).toBeUndefined();

        expect(materialsCommonLambert.specular).toBeUndefined();
        expect(materialsCommonLambert.shininess).toBeUndefined();
    });

    it('adds sampler defaults', function() {
        var gltf = {
            samplers : [
                {
                    // Intentionally empty
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        var sampler = gltfWithDefaults.samplers[0];
        expect(sampler.wrapS).toBe(WebGLConstants.REPEAT);
        expect(sampler.wrapT).toBe(WebGLConstants.REPEAT);
    });

    it('adds node defaults', function() {
        var gltf = {
            animations : [
                {
                    channels : [
                        {
                            sampler : 0,
                            target : {
                                node : 0,
                                path : 'rotation'
                            }
                        }
                    ],
                    samplers : [
                        {
                            input : 0,
                            output : 1
                        }
                    ]
                }
            ],
            nodes : [
                {
                    mesh : 0
                },
                {
                    mesh : 1
                },
                {
                    mesh : 2,
                    translation : [1.0, 0.0, 0.0]
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        var animatedNode = gltfWithDefaults.nodes[0];
        var staticNode1 = gltfWithDefaults.nodes[1];
        var staticNode2 = gltfWithDefaults.nodes[2];

        expect(gltfWithDefaults.animations[0].samplers[0].interpolation).toBe('LINEAR');

        expect(animatedNode.matrix).toBeUndefined();
        expect(animatedNode.translation).toEqual([0.0, 0.0, 0.0]);
        expect(animatedNode.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(animatedNode.scale).toEqual([1.0, 1.0, 1.0]);

        expect(staticNode1.matrix).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        expect(staticNode1.translation).toBeUndefined();
        expect(staticNode1.rotation).toBeUndefined();
        expect(staticNode1.scale).toBeUndefined();

        expect(staticNode2.matrix).toBeUndefined();
        expect(staticNode2.translation).toEqual([1.0, 0.0, 0.0]);
        expect(staticNode2.rotation).toEqual([0.0, 0.0, 0.0, 1.0]);
        expect(staticNode2.scale).toEqual([1.0, 1.0, 1.0]);
    });

    it('adds scene defaults', function() {
        var gltf = {
            scenes : [
                {
                    nodes : [
                        0
                    ]
                }
            ]
        };

        var gltfWithDefaults = addDefaults(gltf);
        expect(gltfWithDefaults.scene).toBe(0);
    });
});
