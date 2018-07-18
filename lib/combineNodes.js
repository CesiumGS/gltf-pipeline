'use strict';
var Cesium = require('cesium');
var NodeHelpers = require('./NodeHelpers');
var PrimitiveHelpers = require('./PrimitiveHelpers');
var RemoveUnusedProperties = require('./RemoveUnusedProperties');
var getUniqueId = require('./getUniqueId');

var Matrix4 = Cesium.Matrix4;
var defined = Cesium.defined;
var removeNodes = RemoveUnusedProperties.removeNodes;

module.exports = combineNodes;

var rootNodePrefix = 'rootNode';
var scratchTransform = new Matrix4();

/**
 * Combines nodes where possible.
 * Primitives in meshes on child nodes are transformed by their node's transform and passed up the node chain
 * if the primitive does not share data with primitives on another node. Meshes used by multiple nodes
 * cannot be collapsed. Camera nodes and nodes targeted as joints or skeletons will be preserved.
 * Should be run before the combineMeshes stage so that all combinable meshes are contained by one node.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with combined nodes.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 * @see combineMeshes
 */
function combineNodes(gltf) {
    var nodes = gltf.nodes;
    var exclude = {};
    getAnimationTargets(gltf, exclude);
    getTechniqueTargets(gltf, exclude);

    var scenes = gltf.scenes;
    for (var sceneId in scenes) {
        if (scenes.hasOwnProperty(sceneId)) {
            var scene = scenes[sceneId];
            var sceneNodes = scene.nodes;
            if (defined(sceneNodes)) {
                var rootNodeId = getUniqueId(gltf, rootNodePrefix);
                var rootNode = {
                    children : sceneNodes,
                    meshes : [],
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
                nodes[rootNodeId] = rootNode;
                mergeChildrenIntoNode(gltf, rootNodeId, NodeHelpers.mapMeshesToNodes(gltf), mapMeshesToMeshes(gltf), exclude);
                removeVestigialNodes(gltf, rootNodeId, exclude);
                if (rootNode.children.length > 0 && rootNode.meshes.length === 0) {
                    scene.nodes = rootNode.children;
                } else {
                    scene.nodes = [rootNodeId];
                }
            }
        }
    }
    removeNodes(gltf);
    return gltf;
}

function getAnimationTargets(gltf, targets) {
    var animations = gltf.animations;
    for (var animationId in animations) {
        if (animations.hasOwnProperty(animationId)) {
            var channels = animations[animationId].channels;
            for (var i = 0; i < channels.length; i++) {
                var nodeId = channels[i].target.id;
                targets[nodeId] = true;
            }
        }
    }
    return targets;
}

function getTechniqueTargets(gltf, targets) {
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            if (defined(technique.parameters)) {
                var parameters = technique.parameters;
                for (var parameterId in parameters) {
                    if (parameters.hasOwnProperty(parameterId)) {
                        var parameter = parameters[parameterId];
                        if (defined(parameter.node)) {
                            targets[parameter.node] = true;
                        }
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
                var meshIds = childNode.meshes;
                if (defined(meshIds)) {
                    childNode.meshes = [];
                    while(meshIds.length > 0) {
                        var meshId = meshIds.pop();
                        if (meshesToNodes[meshId].length === 1 && meshesToMeshes[meshId].length === 0) {
                            var mesh = meshes[meshId];
                            if (!Matrix4.equals(transform, Matrix4.IDENTITY)) {
                                PrimitiveHelpers.transformPrimitives(gltf, mesh.primitives, transform);
                            }
                            if (!defined(node.meshes)) {
                                node.meshes = [];
                            }
                            if (node.meshes.indexOf(meshId) < 0) {
                                node.meshes.push(meshId);
                            }
                        } else {
                            childNode.meshes.push(meshId);
                            preserve = true;
                        }
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
        node.matrix= packedTransform;
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
    if (defined(node.meshes) && node.meshes.length > 0) {
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
        var meshIds = Object.keys(meshes);
        while (meshIds.length > 0) {
            var meshId = meshIds.pop();
            var meshConflicts = meshesToMeshes[meshId];
            if (!defined(meshConflicts)) {
                meshConflicts = [];
                meshesToMeshes[meshId] = meshConflicts;
            }
            var mesh = meshes[meshId];
            var meshIdsLength = meshIds.length;
            for (var i = 0; i < meshIdsLength; i++) {
                var compareMeshId = meshIds[i];
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
            if (PrimitiveHelpers.primitivesShareAttributeAccessor(primitive, comparePrimitive, ['POSITION', 'NORMAL'])) {
                if (PrimitiveHelpers.primitivesHaveOverlappingIndexAccessors(gltf, primitive, comparePrimitive)) {
                    return true;
                }
            }
        }
    }
    return false;
}
