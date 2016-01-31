'use strict';

var removeUnusedNodes = require('../../').removeUnusedNodes;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedNodes', function() {
    it('removes an isolated node', function() {
        var gltf = {
            "nodes": {
                "node_3": {
                    "children": [
                        "left_node",
                        "right_node"
                    ]
                },
                "left_node": {
                },
                "right_node": {
                    "children": [
                        "txtrLocator026Node"
                    ]
                },
                "txtrLocator026Node": {
                },
                "unusedNodeId": {
                }
            },
            "scenes": {
                "defaultScene": {
                    "nodes": [
                        "node_3"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedNodes(gltf, stats);
        expect(gltf.nodes.unusedNodeId).not.toBeDefined();
        expect(stats.numberRemoved.nodes).toEqual(1);
    });

    it('removes an unused tree', function() {
        var gltf = {
            "nodes": {
                "node_3": {
                    "children": [
                        "left_node",
                        "right_node"
                    ]
                },
                "left_node": {
                },
                "right_node": {
                    "children": [
                        "txtrLocator026Node"
                    ]
                },
                "txtrLocator026Node": {
                }
            },
            "scenes": {
                "defaultScene": {
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedNodes(gltf, stats);
        expect(gltf.nodes.node_3).not.toBeDefined();
        expect(gltf.nodes.left_node).not.toBeDefined();
        expect(gltf.nodes.right_node).not.toBeDefined();
        expect(gltf.nodes.txtrLocator026Node).not.toBeDefined();
        expect(stats.numberRemoved.nodes).toEqual(4);
    });

    it('removes an extra tree', function() {
        var gltf = {
            "nodes": {
                "node_3": {
                    "children": [
                        "left_node",
                        "right_node"
                    ]
                },
                "left_node": {
                },
                "right_node": {
                    "children": [
                        "txtrLocator026Node"
                    ]
                },
                "txtrLocator026Node": {
                },
                "unusedRootId": {
                    "children": [
                        "unusedLeftId",
                        "unusedRightId"
                    ]
                },
                "unusedLeftId": {
                },
                "unusedRightId": {
                    "children": [
                        "unusedChildId"
                    ]
                },
                "unusedChildId": {
                }
            },
            "scenes": {
                "defaultScene": {
                    "nodes": [
                        "node_3"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedNodes(gltf, stats);
        expect(gltf.nodes.unusedRootId).not.toBeDefined();
        expect(gltf.nodes.unusedLeftId).not.toBeDefined();
        expect(gltf.nodes.unusedRightId).not.toBeDefined();
        expect(gltf.nodes.unusedChildId).not.toBeDefined();
        expect(stats.numberRemoved.nodes).toEqual(4);
    });

    it('does not remove any nodes', function() {
        var gltf = {
            "nodes": {
                "node_3": {
                    "children": [
                        "left_node",
                        "right_node"
                    ]
                },
                "left_node": {
                },
                "right_node": {
                    "children": [
                        "txtrLocator026Node"
                    ]
                },
                "txtrLocator026Node": {
                }
            },
            "scenes": {
                "defaultScene": {
                    "nodes": [
                        "node_3"
                    ]
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedNodes(gltf, stats);
        expect(gltf.nodes.node_3).toBeDefined();
        expect(gltf.nodes.left_node).toBeDefined();
        expect(gltf.nodes.right_node).toBeDefined();
        expect(gltf.nodes.txtrLocator026Node).toBeDefined();
        expect(stats.numberRemoved.nodes).toEqual(0);
    });
});