'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var Matrix4 = Cesium.Matrix4;
var Cartesian3 = Cesium.Cartesian3;
var Quaternion = Cesium.Quaternion;

// A set of helper functions for working with gltf nodes
// Should be called after convertDagToTree

module.exports = {
    computeFlatTransformScene : computeFlatTransformScene,
    getLocalMatrix4 : getLocalMatrix4,
    getAllNodesInScene : getAllNodesInScene,
    depthFirstTraversal : depthFirstTraversal,
    forEachPrimitiveInScene : forEachPrimitiveInScene,
    mapMeshesToNodes : mapMeshesToNodes
};

var cartesian3Scratch1 = new Cartesian3();
var cartesian3Scratch2 = new Cartesian3();
var quaternionScratch = new Quaternion();
var matrix4Scratch = new Matrix4();
var arrayScratch = [];

// helper for computeFlatTransformScene
function flattenTransform(parameters, node, parent) {
    var scratch = parameters.matrix4Scratch;
    var localTransform = getLocalMatrix4(node, scratch);
    var parentTransform = Matrix4.IDENTITY;
    if (defined(parent)) {
        parentTransform = parent.extras._pipeline.flatTransform;
    }
    node.extras._pipeline.flatTransform = Matrix4.multiply(parentTransform, localTransform, new Matrix4());
}

// computes flattened Matrix4 transforms for every node in the scene
// store these matrices for each node in extras._pipeline.flatTransform
function computeFlatTransformScene(scene, nodes) {
    var rootNodeIDs = scene.nodes;
    var parameters = {
        matrix4Scratch: matrix4Scratch
    };
    for (var id in rootNodeIDs) {
        if (rootNodeIDs.hasOwnProperty(id)) {
            var rootNode = nodes[rootNodeIDs[id]];
            depthFirstTraversal(rootNode, nodes, flattenTransform, parameters);
        }
    }
}

// helper for getAllNodesInScene
function addNodeToArray(parameters, node) {
    parameters.nodeArray.push(node);
}

// get all the nodes in a scene
function getAllNodesInScene(scene, nodes, resultArray) {
    var rootNodeIDs = scene.nodes;
    if (!defined(resultArray)) {
        resultArray = [];
    }
    var parameters = {
        nodeArray: resultArray
    };
    for (var id in rootNodeIDs) {
        if (rootNodeIDs.hasOwnProperty(id)) {
            var rootNode = nodes[rootNodeIDs[id]];
            depthFirstTraversal(rootNode, nodes, addNodeToArray, parameters);
        }
    }
    return resultArray;
}

// Perform a stack based iterative depth first traversal on the specified node.
// Apply functionChildParent to all of its children.
// functionChildParent functions take this node and the parent as arguments
function depthFirstTraversal(rootNode, allNodes, functionChildParent, parameters) {
    // process the root node
    functionChildParent(parameters, rootNode);

    // start the traversal with the root node in the queue.
    var nodeStack = arrayScratch;
    nodeStack = [rootNode];
    while (nodeStack.length > 0) {
        var currentNode = nodeStack.pop();
        // apply the function to all children and push them onto the stack
        if (!defined(currentNode.children)) {
            continue;
        }
        var childrenIDs = currentNode.children;
        for (var id in childrenIDs) {
            if (childrenIDs.hasOwnProperty(id)) {
                var childID = childrenIDs[id];
                var childNode = allNodes[childID];
                functionChildParent(parameters, childNode, currentNode);
                nodeStack.push(childNode);
            }
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
    var transformArray = defaultValue(node.translation, [0, 0, 0]);
    var translation = cartesian3Scratch1;
    translation.x = transformArray[0];
    translation.y = transformArray[1];
    translation.z = transformArray[2];

    transformArray = defaultValue(node.scale, [1, 1, 1]);
    var scale = cartesian3Scratch2;
    scale.x = transformArray[0];
    scale.y = transformArray[1];
    scale.z = transformArray[2];

    var rotation = quaternionScratch;
    var rotationArray = defaultValue(node.rotation, [0, 0, 0, 1]);
    rotation.x = rotationArray[0];
    rotation.y = rotationArray[1];
    rotation.z = rotationArray[2];
    rotation.w = rotationArray[3];
    
    return Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, result);
}

var packedParametersScratch = {
    meshes : undefined,
    parameters : undefined,
    primitiveFunction : undefined
};

// Perform an operation on each primitive in a scene.
// PrimitiveFunction should expect primitive, a meshPrimitiveID, some parameters, and the node itself
function forEachPrimitiveInScene(gltf, scene, primitiveFunction, parameters) {
    var rootNodeNames = scene.nodes;
    var allNodes = gltf.nodes;
    packedParametersScratch.meshes = gltf.meshes;
    packedParametersScratch.parameters = parameters;
    packedParametersScratch.primitiveFunction = primitiveFunction;
    for (var nodeID in rootNodeNames) {
        if (rootNodeNames.hasOwnProperty(nodeID)) {
            var rootNodeName = rootNodeNames[nodeID];
            depthFirstTraversal(allNodes[rootNodeName], allNodes, forEachPrimitiveInNode, packedParametersScratch);
        }
    }
}

function forEachPrimitiveInNode(packedParameters, node) {
    var meshes = packedParameters.meshes;
    var parameters = packedParameters.parameters;
    var primitiveFunction = packedParameters.primitiveFunction;

    var meshIDs = node.meshes;
    if (!defined(meshIDs)) {
        return;
    }
    var meshIdsLength = meshIDs.length;
    for (var i = 0; i < meshIdsLength; i++) {
        var meshID = meshIDs[i];
        var meshData = meshes[meshID];
        var primitives = meshData.primitives;
        var primitiveIdsLength = primitives.length;
        for (var j = 0; j < primitiveIdsLength; j++) {
            primitiveFunction(primitives[j], meshID + '_' + j, parameters, node);
        }
    }
}

function mapMeshesToNodes(gltf) {
    var meshesToNodes = {};
    var nodes = gltf.nodes;
    for (var nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
            var node = nodes[nodeId];
            var meshes = node.meshes;
            if (defined(meshes)) {
                var meshesLength = meshes.length;
                for (var i = 0; i < meshesLength; i++) {
                    var mesh = meshes[i];
                    var nodeMapping = meshesToNodes[mesh];
                    if (!defined(nodeMapping)) {
                        nodeMapping = [];
                        meshesToNodes[mesh] = nodeMapping;
                    }
                    nodeMapping.push(nodeId);
                }
            }
        }
    }
    return meshesToNodes;
}

