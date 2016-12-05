'use strict';
var Cesium = require('cesium');

var getUniqueId = require('./getUniqueId');
var findAccessorMinMax = require('./findAccessorMinMax');
var loadGltfUris = require('./loadGltfUris');

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var Quaternion = Cesium.Quaternion;
var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = updateVersion;

var updateFunctions = {
    '0.8' : glTF_0_8_to_glTF_1_0,
    '1.0' : glTF_1_0_to_glTF_1_1
};

/**
 * Update the glTF version to the latest (1.1), or targetVersion if specified.
 * Applies changes made to the glTF spec between revisions so that the core library
 * only has to handle the latest version.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Options for updating the glTF.
 * @param {String} [options.targetVersion] The glTF will be upgraded until it hits the specified version.
 * @returns {Object} The updated glTF asset.
 */
function updateVersion(gltf, options) {
    options = defaultValue(options, {});
    var targetVersion = options.targetVersion;
    var version = gltf.version;
    if (defined(gltf.asset)) {
        version = defaultValue(version, gltf.asset.version);
    }
    if (!defined(version)) {
        throw new DeveloperError('glTF must have a defined version');
    }
    var updateFunction = updateFunctions[version];
    while (defined(updateFunction)) {
        updateFunction(gltf);
        version = gltf.asset.version;
        if (version === targetVersion) {
            break;
        }
        updateFunction = updateFunctions[version];
    }
    return gltf;
}

function glTF_0_8_to_glTF_1_0(gltf) {
    if (!defined(gltf.asset)) {
        gltf.asset = {};
    }
    var asset = gltf.asset;
    asset.version = '1.0';
    // profile should be an object, not a string
    if (!defined(asset.profile) || (typeof asset.profile === 'string')) {
        asset.profile = {};
    }
    // version property should be in asset, not on the root element
    if (defined(gltf.version)) {
        delete gltf.version;
    }
    // material.instanceTechnique properties should be directly on the material
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var instanceTechnique = material.instanceTechnique;
            if (defined(instanceTechnique)) {
                material.technique = instanceTechnique.technique;
                material.values = instanceTechnique.values;
                delete material.instanceTechnique;
            }
        }
    }
    // primitive.primitive should primitive.mode
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            if (defined(primitives)) {
                var primitivesLength = primitives.length;
                for (var i = 0; i < primitivesLength; i++) {
                    var primitive = primitives[i];
                    var defaultMode = defaultValue(primitive.primitive, WebGLConstants.TRIANGLES);
                    primitive.mode = defaultValue(primitive.mode, defaultMode);
                    delete primitive.primitive;
                }
            }
        }
    }
    // node rotation should be quaternion, not axis-angle
    // node.instanceSkin is deprecated
    var nodes = gltf.nodes;
    var axis = new Cartesian3();
    var quat = new Quaternion();
    for (var nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
            var node = nodes[nodeId];
            if (defined(node.rotation)) {
                var rotation = node.rotation;
                Cartesian3.fromArray(rotation, 0, axis);
                Quaternion.fromAxisAngle(axis, rotation[3], quat);
                node.rotation = [quat.x, quat.y, quat.z, quat.w];
            }
            var instanceSkin = node.instanceSkin;
            if (defined(instanceSkin)) {
                node.skeletons = instanceSkin.skeletons;
                node.skin = instanceSkin.skin;
                node.meshes = instanceSkin.meshes;
                delete node.instanceSkin;
            }
        }
    }
    // technique.pass and techniques.passes are deprecated
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var passes = technique.passes;
            if (defined(passes)) {
                var passName = defaultValue(technique.pass, 'defaultPass');
                if (passes.hasOwnProperty(passName)) {
                    var pass = passes[passName];
                    var instanceProgram = pass.instanceProgram;
                    technique.attributes = defaultValue(technique.attributes, instanceProgram.attributes);
                    technique.program = defaultValue(technique.program, instanceProgram.program);
                    technique.uniforms = defaultValue(technique.uniforms, instanceProgram.uniforms);
                    technique.states = defaultValue(technique.states, pass.states);
                }
                delete technique.passes;
                delete technique.pass;
            }
        }
    }
    // gltf.allExtensions -> extensionsUsed
    if (defined(gltf.allExtensions)) {
        gltf.extensionsUsed = gltf.allExtensions;
        gltf.allExtensions = undefined;
    }
}

function glTF_1_0_to_glTF_1_1(gltf) {
    if (!defined(gltf.asset)) {
        gltf.asset = {};
    }
    var asset = gltf.asset;
    asset.version = '1.1';
    // profile.version does not include revision number ("1.0.3" -> "1.0")
    var profile = asset.profile;
    if (defined(profile)) {
        var version = profile.version;
        if (defined(version)) {
            profile.version = version[0] + '.' + version[2];
        }
    }
    // animation.samplers now refers directly to accessors and animation.parameters should be removed
    var animations = gltf.animations;
    for (var animationId in animations) {
        if (animations.hasOwnProperty(animationId)) {
            var animation = animations[animationId];
            var parameters = animation.parameters;
            var samplers = animation.samplers;
            for (var samplerId in samplers) {
                if (samplers.hasOwnProperty(samplerId)) {
                    var sampler = samplers[samplerId];
                    sampler.input = parameters[sampler.input];
                    sampler.output = parameters[sampler.output];
                }
            }
            delete animation.parameters;
        }
    }
    // material.values should be arrays
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var materialValues = material.values;
            for (var materialValueId in materialValues) {
                if (materialValues.hasOwnProperty(materialValueId)) {
                    var materialValue = materialValues[materialValueId];
                    if (!Array.isArray(materialValue)) {
                        materialValues[materialValueId] = [materialValue];
                    }
                }
            }
        }
    }
    // TEXCOORD and COLOR attributes must be written with a set index (TEXCOORD_#)
    var meshes = gltf.meshes;
    var i;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            if (defined(primitives)) {
                var primitivesLength = primitives.length;
                for (i = 0; i < primitivesLength; i++) {
                    var primitive = primitives[i];
                    var attributes = primitive.attributes;
                    var semantics = Object.keys(attributes);
                    var semanticsLength = semantics.length;
                    for (var j = 0; j < semanticsLength; j++) {
                        var semantic = semantics[j];
                        if (semantic === 'TEXCOORD') {
                            attributes.TEXCOORD_0 = attributes[semantic];
                            delete attributes[semantic];
                        }
                        if (semantic === 'COLOR') {
                            attributes.COLOR_0 = attributes[semantic];
                            delete attributes[semantic];
                        }
                    }
                }
            }
        }
    }
    // technique.parameters.value should be arrays
    // TEXCOORD and COLOR semantics must be written with a set index (TEXCOORD_#)
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var techniqueParameters = technique.parameters;
            for (var techniqueParameterId in techniqueParameters) {
                if (techniqueParameters.hasOwnProperty(techniqueParameterId)) {
                    var techniqueParameter = techniqueParameters[techniqueParameterId];
                    var techniqueParameterValue = techniqueParameter.value;
                    if (defined(techniqueParameterValue) && !Array.isArray(techniqueParameterValue)) {
                        techniqueParameter.value = [techniqueParameterValue];
                    }
                    var techniqueParameterSemantic = techniqueParameter.semantic;
                    if (defined(techniqueParameterSemantic)) {
                        if (techniqueParameterSemantic === 'TEXCOORD') {
                            techniqueParameter.semantic = 'TEXCOORD_0';
                        } else if (techniqueParameterSemantic === 'COLOR') {
                            techniqueParameter.semantic = 'COLOR_0';
                        }
                    }
                }
            }
        }
    }
    // accessor.min and accessor.max must be defined
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    for (var accessorId in accessors) {
        if (accessors.hasOwnProperty(accessorId)) {
            var accessor = accessors[accessorId];
            if (!defined(accessor.min) || !defined(accessor.max)) {
                var bufferViewId = accessor.bufferView;
                var bufferView = bufferViews[bufferViewId];
                var bufferId = bufferView.buffer;
                var buffer = buffers[bufferId];
                if (!defined(buffer.extras) || !defined(buffer.extras._pipeline) || !defined(buffer.extras._pipeline.source)) {
                    // glTF uris need to be loaded into extras for findAccessorMinMax
                    loadGltfUris(gltf);
                }
                var minMax = findAccessorMinMax(gltf, accessor);
                accessor.min = minMax.min;
                accessor.max = minMax.max;
            }
        }
    }
    // skeleton hierarchy must be separate from the node hierarchy (a node with jointName cannot contain camera, skeletons, skins, or meshes)
    var nodes = gltf.nodes;
    var node;
    var nodeId;
    var nodeStack = [];
    var mappedSkeletonNodes = {};
    var parentNodes = {};
    for (nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
            nodeStack.push(nodeId);
            node = nodes[nodeId];
            var children = node.children;
            if (defined(children)) {
                var childrenLength = children.length;
                for (i = 0; i < childrenLength; i++) {
                    var childNodeId = children[i];
                    parentNodes[childNodeId] = nodeId;
                }
            }
        }
    }
    while (nodeStack.length > 0) {
        nodeId = nodeStack.pop();
        node = nodes[nodeId];
        var jointName = node.jointName;
        if (defined(jointName)) {
            // this node is a joint; clone the hierarchy
            if (!defined(node.camera) && !defined(node.skeletons) && !defined(node.skins) && !defined(node.meshes) && !defined(node.children)) {
                // the original node can be removed since it is only a skeleton node
                var parentId = parentNodes[nodeId];
                if (defined(parentId)) {
                    var parentChildren = nodes[parentId].children;
                    parentChildren.splice(parentChildren.indexOf(nodeId), 1);
                }
                delete nodes[nodeId];
            }
            var lastNodeId;
            var skeletonNode;
            var end = false;
            while (defined(nodeId)) {
                var skeletonNodeId = mappedSkeletonNodes[nodeId];
                if (!defined(skeletonNodeId)) {
                    skeletonNodeId = getUniqueId(gltf, nodeId + '-skeleton');
                    skeletonNode = {
                        jointName: jointName
                    };
                    if (defined(node.translation) || defined(node.rotation) || defined(node.scale)) {
                        skeletonNode.translation = defaultValue(node.translation, [0.0, 0.0, 0.0]);
                        skeletonNode.rotation = defaultValue(node.rotation, [0.0, 0.0, 0.0, 1.0]);
                        skeletonNode.scale = defaultValue(node.scale, [1.0, 1.0, 1.0]);
                    } else {
                        skeletonNode.matrix = defaultValue(node.matrix, [
                            1.0, 0.0, 0.0, 0.0,
                            0.0, 1.0, 0.0, 0.0,
                            0.0, 0.0, 1.0, 0.0,
                            0.0, 0.0, 0.0, 1.0]);
                    }
                    delete node.jointName;
                    nodes[skeletonNodeId] = skeletonNode;
                    mappedSkeletonNodes[nodeId] = skeletonNodeId;
                } else {
                    end = true;
                }
                if (defined(lastNodeId)) {
                    skeletonNode = nodes[skeletonNodeId];
                    var skeletonChildren = skeletonNode.children;
                    if (!defined(skeletonChildren)) {
                        skeletonNode.children = [lastNodeId];
                    } else {
                        skeletonChildren.push(lastNodeId);
                    }
                }
                if (end) {
                    break;
                }
                lastNodeId = skeletonNodeId;
                nodeId = parentNodes[nodeId];
                node = nodes[nodeId];
            }
        }
    }
}

