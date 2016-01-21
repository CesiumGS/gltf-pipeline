'use strict';

var removeUnusedCameras = require('../../').removeUnusedCameras;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedCameras', function() {
    it('removes a camera', function() {
        var gltf = {
            "cameras": {
                "camera_0": {
                    "perspective": {
                        "aspect_ratio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                },
                "unusedCameraId": {
                    "perspective": {
                        "aspect_ratio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                }
            },
            "nodes": {
                "node_3": {
                    "camera": "camera_0",
                    "children": [
                        "Geometry-mesh002Node",
                        "groupLocator030Node"
                    ],
                    "matrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        0,
                        -1,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "name": "Y_UP_Transform"
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
                        "aspect_ratio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    },
                    "type": "perspective"
                }
            },
            "nodes": {
                "node_3": {
                    "camera": "camera_0",
                    "children": [
                        "Geometry-mesh002Node",
                        "groupLocator030Node"
                    ],
                    "matrix": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        0,
                        -1,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                    "name": "Y_UP_Transform"
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedCameras(gltf, stats);
        expect(gltf.cameras.camera_0).toBeDefined();
        expect(stats.numberOfCamerasRemoved).toEqual(0);
    });
});