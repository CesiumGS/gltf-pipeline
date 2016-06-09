'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var Matrix4 = Cesium.Matrix4;
var Cartesian3 = Cesium.Cartesian3;
var Quaternion = Cesium.Quaternion;

// A set of helper functions for working with gltf nodes
// Should be called after convertDagToTree

module.exports = {
    computeFlatTransformScene: computeFlatTransformScene,
    getLocalMatrix4: getLocalMatrix4,
    getAllNodesInScene: getAllNodesInScene,
    depthFirstTraversal: depthFirstTraversal
};

// computes flattened Matrix4 transforms for ever node in the scene
// store these matrices for each node in extras._pipeline.flatTransform
function computeFlatTransformScene(scene, nodes) {
    var rootNodeIDs = scene.nodes;
    var scratchMat4 = new Matrix4();
    var flattenTransformFunction = function(node, parent) {
        var localTransform = getLocalMatrix4(node, scratchMat4);
        var parentTransform = Matrix4.IDENTITY;
        if (defined(parent)) {
            parentTransform = parent.extras._pipeline.flatTransform;
        }
        var flatTransform = new Matrix4();
        Matrix4.multiply(parentTransform, localTransform, flatTransform);
        node.extras._pipeline.flatTransform = flatTransform;
    };
    for (var index in rootNodeIDs) {
        var rootNode = nodes[rootNodeIDs[index]];
        depthFirstTraversal(rootNode, nodes, flattenTransformFunction);
    }
}

// get all the nodes in a scene
function getAllNodesInScene(scene, nodes) {
    var rootNodeIDs = scene.nodes;
    var allSceneNodes = [];
    var addNodeFunction = function(node) {
        allSceneNodes.push(node);
    };
    for (var index in rootNodeIDs) {
        var rootNode = nodes[rootNodeIDs[index]];
        depthFirstTraversal(rootNode, nodes, addNodeFunction);
    }
    return allSceneNodes;
}

// Perform a stack based iterative depth first traversal on the specified node.
// Apply functionNodeMatrix to all of its children.
// functionNodeMatrix functions take this node and the parent as arguments
function depthFirstTraversal(rootNode, allNodes, functionChildParent) {
    // process the root node
    functionChildParent(rootNode);

    // start the traversal with the root node in the queue.
    var nodeStack = [rootNode];
    while (nodeStack.length > 0) {
        var currentNode = nodeStack.pop();
        // apply the function to all children and push them onto the stack
        if (!defined(currentNode.children)) {
            continue;
        }
        var childrenIDs = currentNode.children;
        for (var index in childrenIDs) {
            var childID = childrenIDs[index];
            var childNode = allNodes[childID];
            functionChildParent(childNode, currentNode);
            nodeStack.push(childNode);
        }
    }
}

// gets the local matrix of a node, or computes it from TRS
function getLocalMatrix4(node, result) {
    if (!defined(result)) {
        result = new Matrix4();
    }
    // if there is a matrix already, return the matrix
    if (defined(node.matrix)) {
        return Matrix4.fromColumnMajorArray(node.matrix, result);
    }
    // get it from TRS
    var translation = Cartesian3.fromArray(defaultValue(node.translation, [0, 0, 0]));
    var scale = Cartesian3.fromArray(defaultValue(node.scale, [1, 1, 1]));

    var rotation = new Quaternion();
    var rotationArray = defaultValue(node.rotation, [0, 0, 0, 1]);
    rotation.x = rotationArray[0];
    rotation.y = rotationArray[1];
    rotation.z = rotationArray[2];
    rotation.w = rotationArray[3];

    return Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, result);
}
