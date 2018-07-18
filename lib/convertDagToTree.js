'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var defined = Cesium.defined;

module.exports = convertDagToTree;

/**
 * Walks the node graph and corrects from a DAG (directed acyclic graph)
 * to a tree. If multiple nodes have the same child node, the child will be duplicated
 * so that they no longer refer to the same node.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with any DAGs resolved to trees.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function convertDagToTree(gltf) {
    var scenes = gltf.scenes;
    var nodes = gltf.nodes;

    if (defined(scenes) && defined(nodes)) {
        for (var sceneId in scenes) {
            if (scenes.hasOwnProperty(sceneId)) {
                var roots = scenes[sceneId].nodes;
                if (defined(roots)) {
                    //For each scene, reinitialize all nodes to unvisited
                    for (var nodeId in nodes) {
                        if (nodes.hasOwnProperty(nodeId)) {
                            nodes[nodeId].extras._pipeline.visited = false;
                            nodes[nodeId].extras._pipeline.copy = 0;
                        }
                    }

                    //Perform a breadth-first search from each root, searching for previously visited nodes
                    var nodeStack = [];
                    var rootsLength = roots.length;
                    for (var i = 0; i < rootsLength; i++) {
                        var root = roots[i];
                        nodeStack.push(root);
                        nodes[root].extras._pipeline.visited = true;
                        while (nodeStack.length > 0) {
                            var currentNode = nodes[nodeStack.shift()];
                            var children = currentNode.children;
                            if (defined(children)) {
                                for (var j = 0; j < children.length; j++) {
                                    var childId = children[j];
                                    var child = nodes[childId];
                                    //If child has already been visited, duplicate and search the subgraph
                                    if (child.extras._pipeline.visited) {
                                        nodeStack.push(duplicateSubgraph(nodes, currentNode, j, childId));
                                    }
                                    else {
                                        child.extras._pipeline.visited = true;
                                        nodeStack.push(childId);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return gltf;
}

//Duplicates and returns the id of the new subgraph root
function duplicateSubgraph(nodes, parent, rootIndex, root) {
    var newRootId = duplicateNode(nodes, root);

    //Keep track of the subgraph nodes that have already been duplicated
    var duplicatedNodes = {};
    duplicatedNodes[root] = newRootId;

    var nodeStack = [];
    nodeStack.push(newRootId);
    while (nodeStack.length > 0) {
        var currentNode = nodes[nodeStack.shift()];
        var children = currentNode.children;
        if (defined(children)) {
            for (var j = 0; j < children.length; j++) {
                //Duplicate the child if it has not been encountered yet
                var childId = children[j];
                if (Object.keys(duplicatedNodes).indexOf(childId) === -1) {
                    duplicatedNodes[childId] = duplicateNode(nodes, childId);
                }

                //Update the list of children with the new child and push it on the node stack
                children.splice(j, 1, duplicatedNodes[childId]);
                nodeStack.push(duplicatedNodes[childId]);
            }
        }
    }

    //Update the parent's children with the new subgraph root id
    parent.children.splice(rootIndex, 1, newRootId);
    return newRootId;
}

//Duplicate node and return the id of the new node
function duplicateNode(nodes, nodeId) {
    var node = nodes[nodeId];
    var copyId = node.extras._pipeline.copy + 1;
    var newId = nodeId;

    //Appends the copy suffix if duplicating the original node
    if (copyId === 1) {
        newId += '_1';
    }

    //Increments the copy suffix until the new node has a unique id
    var nodeKeys = Object.keys(nodes);
    while (nodeKeys.indexOf(newId) !== -1) {
        copyId++;
        newId = newId.slice(0, -1) + copyId;
    }

    var newNode = clone(node);
    nodes[newId] = newNode;
    newNode.extras._pipeline.visited = false;
    newNode.extras._pipeline.copy = copyId;
    return newId;
}
