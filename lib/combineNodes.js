'use strict';
var Cesium = require('cesium');
var addToArray = require('./addToArray');
var NodeHelpers = require('./NodeHelpers');
var PrimitiveHelpers = require('./PrimitiveHelpers');
var RemoveUnusedProperties = require('./RemoveUnusedProperties');

var Matrix4 = Cesium.Matrix4;
var defined = Cesium.defined;
var removeMeshes = RemoveUnusedProperties.removeMeshes;
var removeNodes = RemoveUnusedProperties.removeNodes;

module.exports = combineNodes;

var scratchTransform = new Matrix4();

/**
 * Combines nodes where possible.
 * Primitives on a child node mesh are transformed by their node's transform and passed up the node chain
 * if the primitive does not share data with primitives on another node. Meshes used by multiple nodes
 * cannot be collapsed. Camera nodes and nodes targeted as joints or skeletons will be preserved.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with combined nodes.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function combineNodes(gltf) {
    var nodes = gltf.nodes;
    var scenes = gltf.scenes;

    var exclude = {};
    getAnimationTargets(gltf, exclude);
    getTechniqueTargets(gltf, exclude);
    var scenesLength = scenes.length;
    for (var sceneId = 0; sceneId < scenesLength; sceneId++) {
        var scene = scenes[sceneId];
        var sceneNodes = scene.nodes;
        if (defined(sceneNodes)) {
            var rootNode = {
                children : sceneNodes,
                matrix : [
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0
                ],
                extras : {
                    _pipeline : {}
                }
            };
            var rootNodeId = addToArray(nodes, rootNode);
            mergeChildrenIntoNode(gltf, rootNodeId, NodeHelpers.mapMeshesToNodes(gltf), mapMeshesToMeshes(gltf), exclude);
            removeVestigialNodes(gltf, rootNodeId, exclude);
            if (rootNode.children.length > 0 && !defined(rootNode.mesh)) {
                scene.nodes = rootNode.children;
            } else {
                scene.nodes = [rootNodeId];
            }
        }
    }
    removeNodes(gltf);
    removeMeshes(gltf);
    return gltf;
}

function getAnimationTargets(gltf, targets) {
    var animations = gltf.animations;
    if (defined(animations)) {
        var animationsLength = animations.length;
        for (var animationId = 0; animationId < animationsLength; animationId++) {
            var animation = animations[animationId];
            var channels = animation.channels;
            var channelsLength = channels.length;
            for (var channelId = 0; channelId < channelsLength; channelId++) {
                var channel = channels[channelId];
                targets[channel.target.id] = true;
            }
        }
    }
    return targets;
}

function getTechniqueTargets(gltf, targets) {
    var techniques = gltf.techniques;
    if (defined(techniques)) {
        var techniquesLength = techniques.length;
        for (var techniqueId = 0; techniqueId < techniquesLength; techniqueId++) {
            var technique = techniques[techniqueId];
            var parameters = technique.parameters;
            for (var parameterName in parameters) {
                if (parameters.hasOwnProperty(parameterName)) {
                    var parameter = parameters[parameterName];
                    if (defined(parameter.node)) {
                        targets[parameter.node] = true;
                    }
                }
            }
        }
    }
    return targets;
}

function mergeChildrenIntoNode(gltf, nodeId, meshesToNodes, meshesToMeshes, exclude) {
    var nodes = gltf.nodes;
    var meshes = gltf.meshes;
    var node = nodes[nodeId];
    var children = node.children;
    var transform = scratchTransform;
    if (defined(children)) {
        node.children = [];
        while(children.length > 0) {
            var childNodeId = children.pop();
            var childNode = nodes[childNodeId];
            mergeChildrenIntoNode(gltf, childNodeId, meshesToNodes, meshesToMeshes, exclude);
            var childNodeChildren = childNode.children;
            var preserve = true;
            if (!isFixedNode(gltf, childNodeId, exclude)) {
                preserve = false;
                NodeHelpers.getLocalMatrix4(childNode, transform);
                var meshId = childNode.mesh;
                if (defined(meshId)) {
                    var mesh = meshes[meshId];
                    var primitives = mesh.primitives;
                    if (meshesToNodes[meshId].length === 1 && meshesToMeshes[meshId].length === 0) {
                        if (!Matrix4.equals(transform, Matrix4.IDENTITY)) {
                            PrimitiveHelpers.transformPrimitives(gltf, primitives, transform);
                        }
                        var nodeMeshId = node.mesh;
                        var nodeMesh = meshes[nodeMeshId];
                        if (!defined(nodeMesh)) {
                            nodeMesh = {
                                primitives: [],
                                extras: {
                                    _pipeline: {}
                                }
                            };
                            nodeMeshId = addToArray(meshes, nodeMesh);
                            meshesToNodes[nodeMeshId] = [nodeId];
                            meshesToMeshes[nodeMeshId] = [];
                            node.mesh = nodeMeshId;
                        }
                        while (primitives.length > 0) {
                            var primitive = primitives.pop();
                            nodeMesh.primitives.push(primitive);
                        }
                    }
                    else {
                        preserve = true;
                    }

                }
            }
            if (defined(childNodeChildren)) {
                if (childNodeChildren.length > 0) {
                    preserve = true;
                }
            }
            if (preserve) {
                node.children.push(childNodeId);
            }
        }
    }
}

function removeVestigialNodes(gltf, parentNodeId, exclude) {
    var nodes = gltf.nodes;
    var parentNode = nodes[parentNodeId];
    var children = parentNode.children;
    var transform = scratchTransform;
    if (defined(children)) {
        parentNode.children = [];
        while (children.length > 0) {
            var childNodeId = children.pop();
            if (canMergeToParent(gltf, childNodeId, exclude)) {
                var childNode = nodes[childNodeId];
                var childNodeChildren = childNode.children;
                if (defined(childNodeChildren) && childNodeChildren.length > 0) {
                    NodeHelpers.getLocalMatrix4(childNode, transform);
                    if (!Matrix4.equals(transform, Matrix4.IDENTITY)) {
                        transformNodes(gltf, childNodeChildren, transform);
                    }
                    children = children.concat(childNodeChildren);
                }
            } else {
                parentNode.children.push(childNodeId);
            }
        }
    }
}

var scratchNodeTransform = new Matrix4();
function transformNodes(gltf, nodeIds, transform) {
    var nodes = gltf.nodes;
    var nodeTransform = scratchNodeTransform;
    var nodeIdsLength = nodeIds.length;
    for (var i = 0; i < nodeIdsLength; i++) {
        var node = nodes[nodeIds[i]];
        NodeHelpers.getLocalMatrix4(node, nodeTransform);
        Matrix4.multiply(transform, nodeTransform, nodeTransform);
        delete node.translation;
        delete node.rotation;
        delete node.scale;
        var packedTransform = [];
        Matrix4.pack(nodeTransform, packedTransform);
        node.matrix = packedTransform;
    }
}

function isFixedNode(gltf, nodeId, exclude) {
    var nodes = gltf.nodes;
    var node = nodes[nodeId];
    if (defined(exclude[nodeId])) {
        return true;
    }
    if (defined(node.camera)) {
        return true;
    }
    if (defined(node.jointName)) {
        return true;
    }
    if (defined(node.skeletons) && node.skeletons.length > 0) {
        return true;
    }
    return defined(node.skin);
}

function canMergeToParent(gltf, nodeId, exclude) {
    var nodes = gltf.nodes;
    var node = nodes[nodeId];
    if (isFixedNode(gltf, nodeId, exclude)) {
        return false;
    }
    if (defined(node.mesh)) {
        return false;
    }
    NodeHelpers.getLocalMatrix4(node, scratchTransform);
    if (Matrix4.equals(scratchTransform, Matrix4.IDENTITY)) {
        return true;
    }
    var children = node.children;
    var childrenLength = children.length;
    for (var i = 0; i < childrenLength; i++) {
        var child = children[i];
        if (defined(exclude[child])) {
            return false;
        }
    }
    return true;
}

function mapMeshesToMeshes(gltf) {
    var meshesToMeshes = {};
    var meshes = gltf.meshes;
    if (defined(meshes)) {
        var meshesLength = meshes.length;
        for (var meshId = 0; meshId < meshesLength; meshId++) {
            var mesh = meshes[meshId];
            var meshConflicts = meshesToMeshes[meshId];
            if (!defined(meshConflicts)) {
                meshConflicts = [];
                meshesToMeshes[meshId] = meshConflicts;
            }
            for (var compareMeshId = meshId + 1; compareMeshId < meshesLength; compareMeshId++) {
                var compareMesh = meshes[compareMeshId];
                var compareMeshConflicts = meshesToMeshes[compareMeshId];
                if (!defined(compareMeshConflicts)) {
                    compareMeshConflicts = [];
                    meshesToMeshes[compareMeshId] = compareMeshConflicts;
                }
                if (meshHasConflict(gltf, mesh, compareMesh)) {
                    meshConflicts.push(compareMeshId);
                    compareMeshConflicts.push(meshId);
                }
            }
        }
    }
    return meshesToMeshes;
}

function meshHasConflict(gltf, mesh, compareMesh) {
    var primitives = mesh.primitives;
    var comparePrimitives = compareMesh.primitives;
    var primitivesLength = primitives.length;
    var comparePrimitivesLength = comparePrimitives.length;
    for (var i = 0; i < primitivesLength; i++) {
        var primitive = primitives[i];
        for (var j = 0; j < comparePrimitivesLength; j++) {
            var comparePrimitive = comparePrimitives[j];
            if (PrimitiveHelpers.primitivesShareAttributeAccessor(primitive, comparePrimitive)) {
                if (PrimitiveHelpers.primitivesHaveOverlappingIndexAccessors(gltf, primitive, comparePrimitive)) {
                    return true;
                }
            }
        }
    }
    return false;
}