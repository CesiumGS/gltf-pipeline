'use strict';
var Cesium = require('cesium');
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = RemoveUnusedElements;

/**
 * Contains stages to remove unused glTF elements.
 * An unused element is one that is not referred to by any other element.
 * @constructor
 */
function RemoveUnusedElements() {}

/**
 * Removes all unused elements in gltf in top-down order so newly unused objects down the hierarchy will be removed as well.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused elements.
 */
RemoveUnusedElements.removeAllUnused = function(gltf) {
    RemoveUnusedElements.removeUnusedNodes(gltf);
    RemoveUnusedElements.removeUnusedSkins(gltf);
    RemoveUnusedElements.removeUnusedCameras(gltf);
    RemoveUnusedElements.removeUnusedMeshes(gltf);
    RemoveUnusedElements.removeUnusedAccessors(gltf);
    RemoveUnusedElements.removeUnusedMaterials(gltf);
    RemoveUnusedElements.removeUnusedBufferViews(gltf);
    RemoveUnusedElements.removeUnusedTechniques(gltf);
    RemoveUnusedElements.removeUnusedTextures(gltf);
    RemoveUnusedElements.removeUnusedBuffers(gltf);
    RemoveUnusedElements.removeUnusedPrograms(gltf);
    RemoveUnusedElements.removeUnusedImages(gltf);
    RemoveUnusedElements.removeUnusedSamplers(gltf);
    RemoveUnusedElements.removeUnusedShaders(gltf);
    RemoveUnusedElements.removeUnusedPrimitiveAttributes(gltf);
};

/**
 * Remove all unused nodes in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused nodes.
 */
RemoveUnusedElements.removeUnusedNodes = function(gltf) {
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

    return removeObject(gltf, 'nodes', usedNodeIds);
};

/**
 * Remove all unused skins in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused skins.
 */
RemoveUnusedElements.removeUnusedSkins = function(gltf) {
    var usedSkinIds = findUsedIds(gltf, 'nodes', 'skin');
    return removeObject(gltf, 'skins', usedSkinIds);
};

/**
 * Remove all unused cameras in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused cameras.
 */
RemoveUnusedElements.removeUnusedCameras = function(gltf) {
    var usedCameraIds = findUsedIds(gltf, 'nodes', 'camera');
    return removeObject(gltf, 'cameras', usedCameraIds);
};

/**
 * Remove all unused meshes in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused meshes.
 */
RemoveUnusedElements.removeUnusedMeshes = function(gltf) {
    var usedMeshIds = {};
    var nodes = gltf.nodes;

    // Build hash of used meshes by iterating through nodes
    if (defined(nodes)) {
        for (var nodeId in nodes) {
            if (nodes.hasOwnProperty(nodeId)) {
                if (defined(nodes[nodeId].meshes)) {
                    var nodeMeshes = nodes[nodeId].meshes;
                    var length = nodeMeshes.length;
                    for (var i = 0; i < length; i++) {
                        var id = nodeMeshes[i];
                        usedMeshIds[id] = true;
                    }
                }
            }
        }
    }
    return removeObject(gltf, 'meshes', usedMeshIds);
};

/**
 * Remove all unused accessors in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused accessors.
 */
RemoveUnusedElements.removeUnusedAccessors = function(gltf) {
    var usedAccessorIds = {};
    var meshes = gltf.meshes;
    var skins = gltf.skins;
    var animations = gltf.animations;

    // Build hash of used accessors by iterating through meshes, skins, and animations
    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                var primitives = meshes[meshId].primitives;
                if (defined(primitives)) {
                    var length = primitives.length;
                    for (var i = 0; i < length; i++) {
                        var attributes = primitives[i].attributes;
                        if (defined(attributes)) {
                            for (var attributeId in attributes) {
                                if (attributes.hasOwnProperty(attributeId)) {
                                    var primitiveAccessorId = attributes[attributeId];
                                    usedAccessorIds[primitiveAccessorId] = true;
                                }
                            }
                        }
                        var indicesId = primitives[i].indices;
                        if (defined(indicesId)) {
                            usedAccessorIds[indicesId] = true;
                        }
                    }
                }
            }
        }
    }
    if (defined(skins)) {
        for (var skinId in skins) {
            if (skins.hasOwnProperty(skinId)) {
                var skinAccessorId = skins[skinId].inverseBindMatrices;
                usedAccessorIds[skinAccessorId] = true;
            }
        }
    }
    if (defined(animations)) {
        for (var animationId in animations) {
            if (animations.hasOwnProperty(animationId)) {
                var parameters = animations[animationId].parameters;
                if (defined(parameters)) {
                    for (var parameterId in parameters) {
                        if (parameters.hasOwnProperty(parameterId)) {
                            var animationAccessorId = parameters[parameterId];
                            usedAccessorIds[animationAccessorId] = true;
                        }
                    }
                }
            }
        }
    }
    return removeObject(gltf, 'accessors', usedAccessorIds);
};

/**
 * Remove all unused materials in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused images.
 */
RemoveUnusedElements.removeUnusedMaterials = function(gltf) {
    var usedMaterialIds = {};
    var meshes = gltf.meshes;

    // Build hash of used materials by iterating through meshes
    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                if (defined(meshes[meshId].primitives)) {
                    var primitives = meshes[meshId].primitives;
                    var length = primitives.length;
                    for (var i = 0; i < length; i++) {
                        var id = primitives[i].material;
                        usedMaterialIds[id] = true;
                    }
                }
            }
        }
    }
    return removeObject(gltf, 'materials', usedMaterialIds);
};

/**
 * Remove all unused buffer views in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused buffers views.
 */
RemoveUnusedElements.removeUnusedBufferViews = function(gltf) {
    var usedBufferViewIds = findUsedIds(gltf, 'accessors', 'bufferView');
    return removeObject(gltf, 'bufferViews', usedBufferViewIds);
};

/**
 * Remove all unused techniques in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused techniques
 */
RemoveUnusedElements.removeUnusedTechniques = function(gltf) {
    var usedTechniqueIds = findUsedIds(gltf, 'materials', 'technique');
    return removeObject(gltf, 'techniques', usedTechniqueIds);
};

/**
 * Remove all unused textures in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused textures.
 */
RemoveUnusedElements.removeUnusedTextures = function(gltf) {
    var usedTextureIds = {};
    var materials = gltf.materials;
    var techniques = gltf.techniques;

    // Build hash of used textures by iterating through materials and techniques
    if (defined(materials)) {
        for (var materialId in materials) {
            if (materials.hasOwnProperty(materialId)) {
                if (defined(materials[materialId].values)) {
                    var values = materials[materialId].values;
                    for (var valueId in values) {
                        if (values.hasOwnProperty(valueId)) {
                            if (typeof values[valueId] === 'string') {
                                var materialTextureId = values[valueId];
                                usedTextureIds[materialTextureId] = true;
                            }
                        }
                    }
                }
            }
        }
    }
    if (defined(techniques)) {
        for (var techniqueId in techniques) {
            if (techniques.hasOwnProperty(techniqueId)) {
                if (defined(techniques[techniqueId].parameters)) {
                    var parameters = techniques[techniqueId].parameters;
                    for (var parameterId in parameters) {
                        if (parameters.hasOwnProperty(parameterId)) {
                            if (defined(parameters[parameterId].value)) {
                                var value = parameters[parameterId].value;
                                if (typeof value === 'string') {
                                    var techniqueTextureId = value;
                                    usedTextureIds[techniqueTextureId] = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return removeObject(gltf, 'textures', usedTextureIds);
};

/**
 * Remove all unused buffers in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused buffers.
 */
RemoveUnusedElements.removeUnusedBuffers = function(gltf) {
    var usedBufferIds = findUsedIds(gltf, 'bufferViews', 'buffer');
    return removeObject(gltf, 'buffers', usedBufferIds);
};

/**
 * Remove all unused programs in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused programs.
 */
RemoveUnusedElements.removeUnusedPrograms = function(gltf) {
    var usedProgramIds = findUsedIds(gltf, 'techniques', 'program');
    return removeObject(gltf, 'programs', usedProgramIds);
};

/**
 * Remove all unused images in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused images.
 */
RemoveUnusedElements.removeUnusedImages = function(gltf) {
    var usedImageIds = findUsedIds(gltf, 'textures', 'source');
    return removeObject(gltf, 'images', usedImageIds);
};

/**
 * Remove all unused samplers in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused samplers.
 */
RemoveUnusedElements.removeUnusedSamplers = function(gltf) {
    var usedSamplerIds = findUsedIds(gltf, 'textures', 'sampler');
    return removeObject(gltf, 'samplers', usedSamplerIds);
};

/**
 * Remove all unused shaders in gltf.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused shaders.
 */
RemoveUnusedElements.removeUnusedShaders = function(gltf) {
    var usedShaderIds = {};
    var programs = gltf.programs;

    // Build hash of used shaders by iterating through programs
    if (defined(programs)) {
        for (var programId in programs) {
            if (programs.hasOwnProperty(programId)) {
                var fragId = programs[programId].fragmentShader;
                var vertId = programs[programId].vertexShader;
                usedShaderIds[fragId] = true;
                usedShaderIds[vertId] = true;
            }
        }
    }
    return removeObject(gltf, 'shaders', usedShaderIds);
};

/**
 * Removes references to primitive attributes that aren't defined in the material's technique.
 *
 * @param {Object} gltf A javascript object holding a glTF hierarchy.
 * @returns {Object} gltf with removed unused primitive attributes.
 */
RemoveUnusedElements.removeUnusedPrimitiveAttributes = function(gltf) {
    var meshes = gltf.meshes;
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var materialId = primitive.material;
                var material = materials[materialId];
                var techniqueId = material.technique;
                var technique = techniques[techniqueId];
                var techniqueParameters = technique.parameters;
                var attributes = primitive.attributes;
                var usedAttributes = {};
                for (var attributeSemantic in attributes) {
                    if (attributes.hasOwnProperty(attributeSemantic)) {
                        usedAttributes[attributeSemantic] = false;
                    }
                }
                for (var techniqueParameter in techniqueParameters) {
                    if (techniqueParameters.hasOwnProperty(techniqueParameter)) {
                        var parameterProperties = techniqueParameters[techniqueParameter];
                        var parameterSemantic = parameterProperties.semantic;
                        if (defined(parameterSemantic)) {
                            usedAttributes[parameterSemantic] = true;
                        }
                    }
                }
                for (var attribute in usedAttributes) {
                    if (usedAttributes.hasOwnProperty(attribute)) {
                        if (!usedAttributes[attribute]) {
                            delete attributes[attribute];
                        }
                    }
                }
            }
        }
    }
    return gltf;
};