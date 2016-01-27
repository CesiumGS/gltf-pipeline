'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedNodes;

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

    // Iterate through nodes and remove those that are not in the hash
    var numberOfNodesRemoved = 0;
    if (defined(nodes)) {
        var usedNodes = {};

        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                // If this node is in the hash, then keep it in the glTF asset
                if (defined(usedNodeIds[nodeId])) {
                    usedNodes[nodeId] = nodes[nodeId];
                } else {
                    ++numberOfNodesRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfNodesRemoved += numberOfNodesRemoved;
        }

        gltf.nodes = usedNodes;
    }


    return gltf;
}