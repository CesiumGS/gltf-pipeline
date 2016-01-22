'use strict';

var removeUnusedCameras = require('../../').removeUnusedCameras;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedCameras', function() {
    it('removes a camera', function() {
        var gltf = {
            "cameras": {
                "camera_0": {
                    "perspective": {
                        "aspectRatio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                },
                "unusedCameraId": {
                    "perspective": {
                        "aspectRatio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                }
            },
            "nodes": {
                "node_3": {
                    "camera": "camera_0"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedCameras(gltf, stats);
        expect(gltf.cameras.unusedCameraId).not.toBeDefined();
        expect(stats.numberOfCamerasRemoved).toEqual(1);
    });

    it('does not remove any cameras', function() {
        var gltf = {
            "cameras": {
                "camera_0": {
                    "perspective": {
                        "aspectRatio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                }
            },
            "nodes": {
                "node_3": {
                    "camera": "camera_0"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedCameras(gltf, stats);
        expect(gltf.cameras.camera_0).toBeDefined();
        expect(stats.numberOfCamerasRemoved).toEqual(0);
    });
});