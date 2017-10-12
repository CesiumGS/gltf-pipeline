'use strict';
var Cesium = require('cesium');
var numberOfComponentsForType = require('./numberOfComponentsForType');

var Cartesian3 = Cesium.Cartesian3;
var ComponentDatatype = Cesium.ComponentDatatype;
var Quaternion = Cesium.Quaternion;
var WebGLConstants = Cesium.WebGLConstants;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = updateVersion;

var updateFunctions = {
    '0.8': glTF08to10
};

/**
 * Update the glTF version to the latest version (1.0), or targetVersion if specified.
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
    gltf.asset = defaultValue(gltf.asset, {
        version: '1.0'
    });
    version = defaultValue(version, gltf.asset.version);
    var updateFunction = updateFunctions[version];
    while (defined(updateFunction)) {
        version = gltf.asset.version;
        if (version === targetVersion) {
            break;
        }
        updateFunction(gltf);
        version = gltf.asset.version;
        updateFunction = updateFunctions[version];
    }
    return gltf;
}

function updateInstanceTechniques(gltf) {
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
}

function setPrimitiveModes(gltf) {
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
}

function updateNodes(gltf) {
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
}

function updateAnimations(gltf) {
    var animations = gltf.animations;
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var updatedAccessors = {};
    var axis = new Cartesian3();
    var quat = new Quaternion();
    for (var animationId in animations) {
        if (animations.hasOwnProperty(animationId)) {
            var animation = animations[animationId];
            var channels = animation.channels;
            var parameters = animation.parameters;
            var samplers = animation.samplers;
            if (defined(channels)) {
                var channelsLength = channels.length;
                for (var i = 0; i < channelsLength; ++i) {
                    var channel = channels[i];
                    if (channel.target.path === 'rotation') {
                        var accessorId = parameters[samplers[channel.sampler].output];
                        if (defined(updatedAccessors[accessorId])) {
                            continue;
                        }
                        updatedAccessors[accessorId] = true;
                        var accessor = accessors[accessorId];
                        var bufferView = bufferViews[accessor.bufferView];
                        var buffer = buffers[bufferView.buffer];
                        var source = buffer.extras._pipeline.source;
                        var byteOffset = source.byteOffset + bufferView.byteOffset + accessor.byteOffset;
                        var componentType = accessor.componentType;
                        var count = accessor.count;
                        var componentsLength = numberOfComponentsForType(accessor.type);
                        var length = accessor.count * componentsLength;
                        var typedArray = ComponentDatatype.createArrayBufferView(componentType, source.buffer, byteOffset, length);

                        for (var j = 0; j < count; j++) {
                            var offset = j * componentsLength;
                            Cartesian3.unpack(typedArray, offset, axis);
                            var angle = typedArray[offset + 3];
                            Quaternion.fromAxisAngle(axis, angle, quat);
                            Quaternion.pack(quat, typedArray, offset);
                        }
                    }
                }
            }
        }
    }
}

function removeTechniquePasses(gltf) {
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
}

function glTF08to10(gltf) {
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
    updateInstanceTechniques(gltf);
    // primitive.primitive should be primitive.mode
    setPrimitiveModes(gltf);
    // node rotation should be quaternion, not axis-angle
    // node.instanceSkin is deprecated
    updateNodes(gltf);
    // animations that target rotations should be quaternion, not axis-angle
    updateAnimations(gltf);
    // technique.pass and techniques.passes are deprecated
    removeTechniquePasses(gltf);
    // gltf.lights -> khrMaterialsCommon.lights
    if (defined(gltf.lights)) {
        var extensions = defaultValue(gltf.extensions, {});
        gltf.extensions = extensions;
        var materialsCommon = defaultValue(extensions.KHR_materials_common, {});
        extensions.KHR_materials_common = materialsCommon;
        materialsCommon.lights = gltf.lights;
        delete gltf.lights;
    }
    // gltf.allExtensions -> extensionsUsed
    if (defined(gltf.allExtensions)) {
        gltf.extensionsUsed = gltf.allExtensions;
        delete gltf.allExtensions;
    }
}
