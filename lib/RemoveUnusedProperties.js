'use strict';
var Cesium = require('cesium');
var findUsedIds = require('./findUsedIds');
var removeObject = require('./removeObject');

var defined = Cesium.defined;

module.exports = RemoveUnusedProperties;

/**
 * Contains stages to remove unused glTF elements.
 * An unused element is one that is not referred to by any other element.
 * @constructor
 */
function RemoveUnusedProperties() {}

/**
 * Removes all unused elements in the glTF asset in top-down order so newly unused objects down the hierarchy will be removed as well.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused elements.
 */
RemoveUnusedProperties.removeAll = function(gltf) {
    RemoveUnusedProperties.removeNodes(gltf);
    RemoveUnusedProperties.removeSkins(gltf);
    RemoveUnusedProperties.removeCameras(gltf);
    RemoveUnusedProperties.removeMeshes(gltf);
    RemoveUnusedProperties.removeAccessors(gltf);
    RemoveUnusedProperties.removeMaterials(gltf);
    RemoveUnusedProperties.removeBufferViews(gltf);
    RemoveUnusedProperties.removeTechniques(gltf);
    RemoveUnusedProperties.removeTextures(gltf);
    RemoveUnusedProperties.removeBuffers(gltf);
    RemoveUnusedProperties.removePrograms(gltf);
    RemoveUnusedProperties.removeImages(gltf);
    RemoveUnusedProperties.removeSamplers(gltf);
    RemoveUnusedProperties.removeShaders(gltf);
    RemoveUnusedProperties.removePrimitiveAttributes(gltf);
};

/**
 * Remove all unused nodes in the glTF asset
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused nodes.
 */
RemoveUnusedProperties.removeNodes = function(gltf) {
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
 * Remove all unused skins in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused skins.
 */
RemoveUnusedProperties.removeSkins = function(gltf) {
    var usedSkinIds = findUsedIds(gltf, 'nodes', 'skin');
    return removeObject(gltf, 'skins', usedSkinIds);
};

/**
 * Remove all unused cameras in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused cameras.
 */
RemoveUnusedProperties.removeCameras = function(gltf) {
    var usedCameraIds = findUsedIds(gltf, 'nodes', 'camera');
    return removeObject(gltf, 'cameras', usedCameraIds);
};

/**
 * Remove all unused meshes in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused meshes.
 */
RemoveUnusedProperties.removeMeshes = function(gltf) {
    var usedMeshIds = {};
    var meshes = gltf.meshes;
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
                        var mesh = meshes[id];
                        if (!defined(mesh.primitives) || mesh.primitives.length === 0) {
                            // This is an empty mesh, remove it
                            nodeMeshes.splice(i, 1);
                            i--;
                            length--;
                        } else {
                            usedMeshIds[id] = true;
                        }
                    }
                }
            }
        }
    }
    return removeObject(gltf, 'meshes', usedMeshIds);
};

/**
 * Remove all unused accessors in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused accessors.
 */
RemoveUnusedProperties.removeAccessors = function(gltf) {
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
 * Remove all unused materials in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused images.
 */
RemoveUnusedProperties.removeMaterials = function(gltf) {
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
 * Remove all unused buffer views in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers views.
 */
RemoveUnusedProperties.removeBufferViews = function(gltf) {
    var usedBufferViewIds = findUsedIds(gltf, 'accessors', 'bufferView');
    return removeObject(gltf, 'bufferViews', usedBufferViewIds);
};

/**
 * Remove all unused techniques in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused techniques
 */
RemoveUnusedProperties.removeTechniques = function(gltf) {
    var usedTechniqueIds = findUsedIds(gltf, 'materials', 'technique');
    return removeObject(gltf, 'techniques', usedTechniqueIds);
};

/**
 * Remove all unused textures in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused textures.
 */
RemoveUnusedProperties.removeTextures = function(gltf) {
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
 * Remove all unused buffers in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers.
 */
RemoveUnusedProperties.removeBuffers = function(gltf) {
    var usedBufferIds = findUsedIds(gltf, 'bufferViews', 'buffer');
    return removeObject(gltf, 'buffers', usedBufferIds);
};

/**
 * Remove all unused programs in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused programs.
 */
RemoveUnusedProperties.removePrograms = function(gltf) {
    var usedProgramIds = findUsedIds(gltf, 'techniques', 'program');
    return removeObject(gltf, 'programs', usedProgramIds);
};

/**
 * Remove all unused images in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused images.
 */
RemoveUnusedProperties.removeImages = function(gltf) {
    var usedImageIds = findUsedIds(gltf, 'textures', 'source');
    return removeObject(gltf, 'images', usedImageIds);
};

/**
 * Remove all unused samplers in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused samplers.
 */
RemoveUnusedProperties.removeSamplers = function(gltf) {
    var usedSamplerIds = findUsedIds(gltf, 'textures', 'sampler');
    return removeObject(gltf, 'samplers', usedSamplerIds);
};

/**
 * Remove all unused shaders in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused shaders.
 */
RemoveUnusedProperties.removeShaders = function(gltf) {
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
 * Removes references to primitive attributes that aren't defined in the primitive material's technique.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused primitive attributes.
 */
RemoveUnusedProperties.removePrimitiveAttributes = function(gltf) {
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
