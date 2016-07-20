'use strict';

var removeUnusedPrimitiveAttributes = require('../../lib/removeUnusedPrimitiveAttributes');

describe('removeUnusedPrimitiveAttributes', function() {
    it('removes unused primitive attributes', function() {
        var gltf = {
            meshes : {
                mesh : {
                    primitives: [
                        {
                            attributes : {
                                KEEP_ATTRIBUTE_1 : 'accessor_1',
                                KEEP_ATTRIBUTE_2 : 'accessor_2',
                                DROP_ATTRIBUTE_3 : 'accessor_3',
                                KEEP_ATTRIBUTE_4 : 'accessor_4',
                                DROP_ATTRIBUTE_5 : 'accessor_5'
                            },
                            material : 'material'
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
                technique : {
                    parameters : {
                        attribute1: {
                            semantic : 'KEEP_ATTRIBUTE_1'
                        },
                        attribute2: {
                            semantic : 'KEEP_ATTRIBUTE_2'
                        },
                        attribute3: {},
                        attribute4 : {
                            semantic : 'KEEP_ATTRIBUTE_4'
                        }
                    }
                }
            }
        };
        removeUnusedPrimitiveAttributes(gltf);
        var attributes = gltf.meshes.mesh.primitives[0].attributes;
        expect(attributes.KEEP_ATTRIBUTE_1).toBeDefined();
        expect(attributes.KEEP_ATTRIBUTE_2).toBeDefined();
        expect(attributes.DROP_ATTRIBUTE_3).not.toBeDefined();
        expect(attributes.KEEP_ATTRIBUTE_4).toBeDefined();
        expect(attributes.DROP_ATTRIBUTE_5).not.toBeDefined();
    });
});
