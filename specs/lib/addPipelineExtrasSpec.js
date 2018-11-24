'use strict';
const Cesium = require('cesium');
const addPipelineExtras = require('../../lib/addPipelineExtras');

const WebGLConstants = Cesium.WebGLConstants;

describe('addPipelineExtras', function() {
    it('adds pipeline extras to glTF 1.0 assets', function() {
        const gltf = {
            buffers: {
                sampleBuffer0: {
                    byteLength: 100
                }
            },
            shaders: {
                sample0VS: {
                    type: WebGLConstants.VERTEX_SHADER,
                    uri: 'data:,'
                }
            },
            images: {
                sampleImage0: {
                    extras: {
                        compressedImage3DTiles: {
                            s3tc: {
                                uri: 'data:,'
                            },
                            etc1: {
                                uri: 'data:,'
                            }
                        }
                    }
                }
            }
        };
        const gltfWithExtras = addPipelineExtras(gltf);
        expect(gltfWithExtras.buffers['sampleBuffer0'].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.shaders['sample0VS'].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images['sampleImage0'].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images['sampleImage0'].extras.compressedImage3DTiles.s3tc.extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images['sampleImage0'].extras.compressedImage3DTiles.etc1.extras._pipeline).toBeDefined();
    });

    it('adds pipeline extras to glTF 2.0 assets', function () {
        const gltf = {
            buffers: [
                {
                    byteLength: 100
                }
            ],
            images: [
                {
                    extras: {
                        compressedImage3DTiles: {
                            s3tc: {
                                uri: 'data:,'
                            },
                            etc1: {
                                uri: 'data:,'
                            }
                        }
                    }
                }
            ],
            extensions: {
                KHR_techniques_webgl: {
                    shaders: [
                        {
                            type: WebGLConstants.VERTEX_SHADER,
                            uri: 'data:,'
                        }
                    ]
                }
            },
            extensionsRequired: [
                'KHR_techniques_webgl'
            ],
            extensionsUsed: [
                'KHR_techniques_webgl'
            ]
        };
        const gltfWithExtras = addPipelineExtras(gltf);
        expect(gltfWithExtras.buffers[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.extensions.KHR_techniques_webgl.shaders[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras.compressedImage3DTiles.s3tc.extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras.compressedImage3DTiles.etc1.extras._pipeline).toBeDefined();
    });
});
