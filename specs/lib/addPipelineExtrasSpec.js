'use strict';
var Cesium = require('cesium');
var addPipelineExtras = require('../../lib/addPipelineExtras');

var WebGLConstants = Cesium.WebGLConstants;

describe('addPipelineExtras', function() {
    it('adds pipeline extras', function() {
        // TODO KHR_technique_webgl: remove shaders from top level, put inside extras.KHR_technique_webgl
        var gltf = {
            buffers : [
                {
                    byteLength : 100
                }
            ],
            shaders : [
                {
                    type : WebGLConstants.VERTEX_SHADER,
                    uri: 'data:,'
                }
            ],
            images : [
                {
                    extras : {
                        compressedImage3DTiles : {
                            s3tc : {
                                uri : 'data:,'
                            },
                            etc1 : {
                                uri : 'data:,'
                            }
                        }
                    }
                }
            ]
        };
        var gltfWithExtras = addPipelineExtras(gltf);
        expect(gltfWithExtras.buffers[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.shaders[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras.compressedImage3DTiles.s3tc.extras._pipeline).toBeDefined();
        expect(gltfWithExtras.images[0].extras.compressedImage3DTiles.etc1.extras._pipeline).toBeDefined();
    });
});
