'use strict';
var pbrToMaterialsCommon = require('../../lib/pbrToMaterialsCommon');

describe('pbrToMaterialsCommon', function() {
    it('deletes PBR properties and modifies extensionsRequired', function() {
        var gltf = {
            materials : [
                {
                    doubleSided : true,
                    emissiveFactor : [],
                    emissiveTexture : {},
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {}
                    },
                    normalTexture : {},
                    occlusionTexture : {},
                    pbrMetallicRoughness : {}
                }
            ],
            extensionsRequired : [ 'KHR_materials_pbrSpecularGlossiness' ],
            extensionsUsed : [ 'KHR_materials_pbrSpecularGlossiness' ]
        };
        pbrToMaterialsCommon(gltf);
        var material = gltf.materials[0];
        expect(material.doubleSided).not.toBeDefined();
        expect(material.emissiveFactor).not.toBeDefined();
        expect(material.emissiveTexture).not.toBeDefined();
        expect(material.extensions.KHR_materials_pbrSpecularGlossiness).not.toBeDefined();
        expect(material.normalTexture).not.toBeDefined();
        expect(material.occlusionTexture).not.toBeDefined();
        expect(material.pbrMetallicRoughness).not.toBeDefined();
        expect(gltf.extensionsRequired).toEqual([ 'KHR_materials_common' ]);
        expect(gltf.extensionsUsed).toEqual([ 'KHR_materials_common' ]);
    });

    it('maps baseColorFactor -> diffuse', function() {
        var gltf = {
            materials : [
                {
                    pbrMetallicRoughness : {
                        baseColorFactor : [ 1.0, 1.0, 1.0, 1.0 ]
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.diffuse).toEqual([ 1.0, 1.0, 1.0, 1.0 ]);
    });

    it('maps baseColorTexture -> diffuse, overriding baseColorFactor', function() {
        var gltf = {
            materials : [
                {
                    pbrMetallicRoughness : {
                        baseColorFactor : [ 1.0, 1.0, 1.0, 1.0 ],
                        baseColorTexture : {
                            index : 2
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.diffuse).toEqual([ 2 ]);
    });

    it('maps pbrSpecularGlossiness.diffuseFactor -> diffuse', function() {
        var gltf = {
            materials : [
                {
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {
                            diffuseFactor : [ 1.0, 1.0, 1.0, 1.0 ]
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.diffuse).toEqual([ 1.0, 1.0, 1.0, 1.0 ]);
    });

    it('maps baseColorTexture -> diffuse even if pbrSpecularGlossiness.diffuseFactor is defined', function() {
        var gltf = {
            materials : [
                {
                    pbrMetallicRoughness : {
                        baseColorFactor : [ 1.0, 1.0, 1.0, 1.0 ],
                        baseColorTexture : {
                            index : 2
                        }
                    },
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {
                            diffuseFactor : [ 1.0, 1.0, 1.0, 1.0 ]
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.diffuse).toEqual([ 2 ]);
    });

    it('maps pbrSpecularGlossiness.diffuseTexture -> diffuse to overwrite baseColorTexture', function() {
        var gltf = {
            materials : [
                {
                    pbrMetallicRoughness : {
                        baseColorFactor : [ 1.0, 1.0, 1.0, 1.0 ],
                        baseColorTexture : {
                            index : 2
                        }
                    },
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {
                            diffuseFactor : [ 1.0, 1.0, 1.0, 1.0 ],
                            diffuseTexture : {
                                index : 3
                            }
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.diffuse).toEqual([ 3 ]);
    });

    it('maps pbrSpecularGlossiness.specularFactor -> specular', function() {
        var gltf = {
            materials : [
                {
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {
                            specularFactor : [ 1.0, 2.0, 3.0 ]
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.specular).toEqual([ 1.0, 2.0, 3.0, 1.0 ]);
    });

    it('maps pbrSpecularGlossiness.glossinessFactor -> shininess', function() {
        var gltf = {
            materials : [
                {
                    extensions : {
                        KHR_materials_pbrSpecularGlossiness : {
                            glossinessFactor : 100.0
                        }
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.shininess).toEqual([ 100.0 ]);
    });

    it('maps occlusionTexture -> ambient', function() {
        var gltf = {
            materials : [
                {
                    occlusionTexture : {
                        index : 4
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.ambient).toEqual([ 4 ]);
    });

    it('maps emissiveFactor -> emission', function() {
        var gltf = {
            materials : [
                {
                    emissiveFactor : [1.0, 2.0, 3.0]
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.emission).toEqual([ 1.0, 2.0, 3.0, 1.0 ]);
    });

    it('maps emissiveTexture -> emission', function() {
        var gltf = {
            materials : [
                {
                    emissiveFactor : [1.0, 2.0, 3.0],
                    emissiveTexture : {
                        index : 5
                    }
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.values.emission).toEqual([ 5 ]);
    });

    it('preserves doubleSided', function () {
        var gltf = {
            materials : [
                {
                    doubleSided : true
                }
            ]
        };
        pbrToMaterialsCommon(gltf);
        expect(gltf.materials[0].extensions.KHR_materials_common.doubleSided).toEqual(true);
    });
});