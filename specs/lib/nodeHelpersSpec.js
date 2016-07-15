'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var clone = require('clone');
var fs = require('fs');

var Matrix4 = Cesium.Matrix4;
var CesiumMath = Cesium.Math;

var fsReadFile = Promise.promisify(fs.readFile);

var NodeHelpers = require('../../lib/NodeHelpers');
var fiveBoxPath = './specs/data/combineObjects/fiveBox.gltf';

describe('NodeHelpers', function() {
    var testScene = {
        "nodes": [
            "leftElbow",
            "rightWrist"
        ]
    };
    var testNodes = {
        "leftShoulder": {
            "children": [
                "leftElbow"
            ],
            "translation": [
                1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "leftElbow": {
            "children": [
                "leftWrist"
            ],
            "translation": [
                1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "leftWrist": {
            "children": [
                "leftPinkie",
                "leftThumb"
            ],
            "translation": [
                1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "leftPinkie": {
            "children": [
            ],
            "translation": [
                0, 1, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "leftThumb": {
            "children": [
            ],
            "translation": [
                0, -1, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "rightWrist": {
            "children": [
                "rightPinkie",
                "rightThumb"
            ],
            "translation": [
                -1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "rightPinkie": {
            "children": [
            ],
            "translation": [
                -1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        },
        "rightThumb": {
            "children": [
            ],
            "translation": [
                -1, 0, 0
            ],
            "extras": {
                "_pipeline": {}
            }
        }
    };

    it('correctly gets the local matrix of a node that has a local matrix', function() {
        var testNode = {
            "matrix": [
                -0.99975, -0.00679829, 0.0213218, 0,
                0.00167596, 0.927325, 0.374254, 0,
                -0.0223165, 0.374196, -0.927081, 0,
                -0.0115543, 0.194711, -0.478297, 1
            ]
        };
        var expectedMatrix4 = Matrix4.fromArray(testNode.matrix);
        var actualMatrix4 = NodeHelpers.getLocalMatrix4(testNode);
        expect(Matrix4.equalsEpsilon(actualMatrix4, expectedMatrix4, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('correctly gets the local matrix of a node that only has TRS', function() {
        var testNode = {
            "rotation": [0, 0, 0, 1],
            "scale": [1, 1, 1],
            "translation": [-17.7082, -11.4156, 2.0922]
        };
        var expectedMatrix4 = Matrix4.fromArray([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -17.7082, -11.4156, 2.0922, 1
        ]);
        var actualMatrix4 = NodeHelpers.getLocalMatrix4(testNode);
        expect(Matrix4.equalsEpsilon(actualMatrix4, expectedMatrix4, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('makes an identity matrix for a node that has no transformation information', function() {
        var testNode = {};
        var expectedMatrix4 = Matrix4.fromArray([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        var actualMatrix4 = NodeHelpers.getLocalMatrix4(testNode);
        expect(Matrix4.equalsEpsilon(actualMatrix4, expectedMatrix4, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('gets all the nodes in a scene', function() {
        var allNodes = NodeHelpers.getAllNodesInScene(testScene, testNodes);
        expect(allNodes.length).toEqual(7);
    });

    it('flattens the transformations in a scene', function() {
        var testNodesClone = clone(testNodes);
        NodeHelpers.computeFlatTransformScene(testScene, testNodesClone);
        var expectLeftPinkie = Matrix4.fromArray([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            2, 1, 0, 1
        ]);
        var expectRightWrist = Matrix4.fromArray([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -1, 0, 0, 1
        ]);
        var actualLeftPinkie = testNodesClone.leftPinkie.extras._pipeline.flatTransform;
        var actualRightWrist = testNodesClone.rightWrist.extras._pipeline.flatTransform;
        expect(Matrix4.equalsEpsilon(actualLeftPinkie, expectLeftPinkie, CesiumMath.EPSILON7)).toEqual(true);
        expect(Matrix4.equalsEpsilon(actualRightWrist, expectRightWrist, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('performs operations per primitive in a scene', function(done) {
        fsReadFile(fiveBoxPath)
            .then(function(data) {
                var gltf = JSON.parse(data);
                var scene = gltf.scenes[gltf.scene];

                var functionParameters = {
                    numberPrimitives: 0,
                    primitiveMeshIDs: [],
                    materialIDs: []
                };

                var primitiveFunction = function (primitive, meshPrimitiveID, parameters) {
                    parameters.numberPrimitives++;
                    parameters.primitiveMeshIDs.push(meshPrimitiveID);
                    parameters.materialIDs.push(primitive.material);
                };

                NodeHelpers.forEachPrimitiveInScene(gltf, scene, primitiveFunction, functionParameters);

                expect(functionParameters.numberPrimitives).toEqual(5);
                expect(functionParameters.primitiveMeshIDs[0]).toEqual('meshTest_0');
                expect(functionParameters.primitiveMeshIDs[4]).toEqual('meshTest_4');
                expect(functionParameters.materialIDs[0]).toEqual('Effect_outer');
                expect(functionParameters.materialIDs[2]).toEqual('Effect_inner');

                done();
            })
            .catch(function(err) {
                throw err;
            });
    });
});
