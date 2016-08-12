'use strict';
var Cesium = require('cesium');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = removeUnusedNodes;

/**
 * Remove all unused nodes in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @param {OptimizationStatistics} stats Record removal statistics.
 * @returns {Object} gltf with removed unused nodes.
 */
function removeUnusedNodes(gltf, stats) {
    var usedNodeIds = {};
    var scenes = gltf.scenes;
    var nodes = gltf.nodes;

    // Build hash of used nodes by traversing through node trees starting at scenes
    if (defined(scenes)) {
        for (var sceneId in scenes) {
            if (scenes.hasOwnProperty(sceneId)) {
                var roots = scenes[sceneId].nodes;
                if (defined(roots)) {
                    var nodeStack = [];
                    var rootsLength = roots.length;
                    for (var i = 0; i < rootsLength; i++) {
                        var root = roots[i];
                        nodeStack.push(root);
                    }
                    
                    while (nodeStack.length > 0) {
                        var node = nodeStack.pop();
                        usedNodeIds[node] = true;

                        var children = nodes[node].children;
                        if (defined(children)) {
                            var childrenLength = children.length;
                            for (var j = 0; j < childrenLength; j++) {
                                var child = children[j];
                                nodeStack.push(child);
                            }
                        }
                    }
                }
            }
        }
    }

    return removeObject(gltf, 'nodes', usedNodeIds, stats);
}
