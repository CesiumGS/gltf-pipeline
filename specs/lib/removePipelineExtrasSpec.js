'use strict';

var removePipelineExtras = require('../../lib/removePipelineExtras');

describe('removePipelineExtras', function() {
    it('removes the extras objects', function() {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin",
                    "extras": {
                        "_pipeline": {
                            "extension": '.bin'
                        },
                        "misc": {}
                    }
                }
            },
            "images": {
                "Cesium_Logo_Flat_Low": {
                    "uri": "Cesium_Logo_Flat_Low.png",
                    "extras": {
                        "_pipeline": {
                            "extension": '.png'
                        },
                        "misc": {}
                    }
                }
            }
        };

        gltf = removePipelineExtras(gltf);
        expect(gltf.buffers.CesiumTexturedBoxTest.extras).toBeDefined();
        expect(gltf.buffers.CesiumTexturedBoxTest.extras._pipeline).not.toBeDefined();
        expect(gltf.images.Cesium_Logo_Flat_Low.extras).toBeDefined();
        expect(gltf.images.Cesium_Logo_Flat_Low.extras._pipeline).not.toBeDefined();
    });

    it('removes the extras objects', function() {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin",
                    "extras": {
                        "_pipeline": {
                            "extension": '.bin'
                        }
                    }
                }
            },
            "images": {
                "Cesium_Logo_Flat_Low": {
                    "uri": "Cesium_Logo_Flat_Low.png",
                    "extras": {
                        "_pipeline": {
                            "extension": '.png'
                        }
                    }
                }
            }
        };

        gltf = removePipelineExtras(gltf);
        expect(gltf.buffers.CesiumTexturedBoxTest.extras).not.toBeDefined();
        expect(gltf.images.Cesium_Logo_Flat_Low.extras).not.toBeDefined();
    });

    it('does not remove any objects', function() {
        var gltf = {
            "buffers": {
                "CesiumTexturedBoxTest": {
                    "uri": "CesiumTexturedBoxTest.bin"
                }
            },
            "images": {
                "Cesium_Logo_Flat_Low": {
                    "uri": "Cesium_Logo_Flat_Low.png"
                }
            }
        };

        gltf = removePipelineExtras(gltf);
        expect(gltf.buffers.CesiumTexturedBoxTest.uri).toBeDefined();
        expect(gltf.images.Cesium_Logo_Flat_Low.uri).toBeDefined();
    });
});