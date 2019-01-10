'use strict';
const Cesium = require('cesium');
const addPipelineExtras = require('../../lib/addPipelineExtras');
const removePipelineExtras = require('../../lib/removePipelineExtras');

const WebGLConstants = Cesium.WebGLConstants;

describe('removePipelineExtras', function() {
    it('removes pipeline extras', function() {
        const gltf = {
            buffers: [
                {
                    byteLength: 100
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
            ]
        };
        const gltfWithExtrasRemoved = removePipelineExtras(addPipelineExtras(gltf));
        expect(gltfWithExtrasRemoved.buffers[0].extras).toBeUndefined();
        expect(gltfWithExtrasRemoved.extensions.KHR_techniques_webgl.shaders[0].extras).toBeUndefined();
        expect(gltfWithExtrasRemoved.images[0].extras._pipeline).toBeUndefined();
        expect(gltfWithExtrasRemoved.images[0].extras.compressedImage3DTiles.s3tc.extras).toBeUndefined();
        expect(gltfWithExtrasRemoved.images[0].extras.compressedImage3DTiles.etc1.extras).toBeUndefined();
        expect(gltfWithExtrasRemoved.extras).toBeUndefined();
    });
});
