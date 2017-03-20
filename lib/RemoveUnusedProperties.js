'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var isTexture = require('./isTexture');
var Remove = require('./Remove');

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

function removeUnusedElements(gltf, type, usedIds) {
    var removed = 0;
    /* jshint unused:vars */
    ForEach[type](gltf, function(object, id) {
       if (!usedIds[id + removed]) {
           Remove[type](gltf, id);
           removed++;
           return -1;
       }
    });
}

/**
 * Remove all unused nodes in the glTF asset
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused nodes.
 */
RemoveUnusedProperties.removeNodes = function(gltf) {
    var usedNodeIds = {};

    ForEach.scene(gltf, function(scene) {
        ForEach.nodeInScene(gltf, scene, function(node, nodeId) {
            usedNodeIds[nodeId] = true;
            var skeletons = node.skeletons;
            if (defined(skeletons)) {
                var skeletonsLength = skeletons.length;
                for (var i = 0; i < skeletonsLength; i++) {
                    usedNodeIds[skeletons[i]] = true;
                }
            }
        });
    });

    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(value) {
            if (defined(value.node)) {
                usedNodeIds[value.node] = true;
            }
        });
    });

    removeUnusedElements(gltf, 'node', usedNodeIds);
    return gltf;
};

/**
 * Remove all unused skins in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused skins.
 */
RemoveUnusedProperties.removeSkins = function(gltf) {
    var usedSkinIds = {};

    ForEach.node(gltf, function(node) {
        var nodeSkinId = node.skin;
        if (defined(nodeSkinId)) {
            usedSkinIds[nodeSkinId] = true;
        }
    });

    removeUnusedElements(gltf, 'skin', usedSkinIds);
    return gltf;
};

/**
 * Remove all unused cameras in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused cameras.
 */
RemoveUnusedProperties.removeCameras = function(gltf) {
    var usedCameraIds = {};

    ForEach.node(gltf, function(node) {
       var cameraId = node.camera;
       if (defined(cameraId)) {
           usedCameraIds[cameraId] = true;
       }
    });

    removeUnusedElements(gltf, 'camera', usedCameraIds);
    return gltf;
};

/**
 * Remove all unused meshes in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused meshes.
 */
RemoveUnusedProperties.removeMeshes = function(gltf) {
    var usedMeshIds = {};

    ForEach.node(gltf, function(node) {
        var meshId = node.mesh;
        if (defined(meshId)) {
            usedMeshIds[meshId] = true;
        }
    });

    removeUnusedElements(gltf, 'mesh', usedMeshIds);
    return gltf;
};

/**
 * Remove all unused accessors in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused accessors.
 */
RemoveUnusedProperties.removeAccessors = function(gltf) {
    var usedAccessorIds = {};

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitives(mesh, function(primitive) {
            ForEach.meshPrimitiveAttributes(primitive, function(accessorId) {
                usedAccessorIds[accessorId] = true;
            });
            var indices = primitive.indices;
            if (defined(indices)) {
                usedAccessorIds[indices] = true;
            }
        });
    });

    ForEach.skin(gltf, function(skin) {
       if (defined(skin.inverseBindMatrices)) {
           usedAccessorIds[skin.inverseBindMatrices] = true;
       }
    });

    ForEach.animation(gltf, function(animation) {
        ForEach.animationSamplers(animation, function(sampler) {
            if (defined(sampler.input)) {
                usedAccessorIds[sampler.input] = true;
            }
            if (defined(sampler.output)) {
                usedAccessorIds[sampler.output] = true;
            }
        });
    });

    removeUnusedElements(gltf, 'accessor', usedAccessorIds);
    return gltf;
};

/**
 * Remove all unused materials in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused images.
 */
RemoveUnusedProperties.removeMaterials = function(gltf) {
    var usedMaterialIds = {};

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitives(mesh, function(primitive) {
            if (defined(primitive.material)) {
                usedMaterialIds[primitive.material] = true;
            }
        });
    });

    removeUnusedElements(gltf, 'material', usedMaterialIds);
    return gltf;
};

/**
 * Remove all unused buffer views in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers views.
 */
RemoveUnusedProperties.removeBufferViews = function(gltf) {
    var usedBufferViewIds = {};

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            usedBufferViewIds[accessor.bufferView] = true;
        }
    });

    removeUnusedElements(gltf, 'bufferView', usedBufferViewIds);
    return gltf;
};

/**
 * Remove all unused techniques in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused techniques
 */
RemoveUnusedProperties.removeTechniques = function(gltf) {
    var usedTechniqueIds = {};

    ForEach.material(gltf, function(material) {
       if (defined(material.technique)) {
           usedTechniqueIds[material.technique] = true;
       }
    });

    removeUnusedElements(gltf, 'technique', usedTechniqueIds);
    return gltf;
};

/**
 * Remove all unused textures in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused textures.
 */
RemoveUnusedProperties.removeTextures = function(gltf) {
    var usedTextureIds = {};

    ForEach.material(gltf, function(material) {
        ForEach.materialValue(material, function(value, name) {
            if (isTexture(name, value)) {
                usedTextureIds[value[0]] = true;
            }
        });
    });

    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter, name) {
            var value = parameter.value;
            if (defined(value)) {
                if (isTexture(name, value)) {
                    usedTextureIds[value[0]] = true;
                }
            }
        });
    });

    removeUnusedElements(gltf, 'texture', usedTextureIds);
    return gltf;
};

/**
 * Remove all unused buffers in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused buffers.
 */
RemoveUnusedProperties.removeBuffers = function(gltf) {
    var usedBufferIds = {};

    ForEach.bufferView(gltf, function(bufferView) {
       if (defined(bufferView.buffer)) {
           usedBufferIds[bufferView.buffer] = true;
       }
    });

    removeUnusedElements(gltf, 'buffer', usedBufferIds);
    return gltf;
};

/**
 * Remove all unused programs in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused programs.
 */
RemoveUnusedProperties.removePrograms = function(gltf) {
    var usedProgramIds = {};

    ForEach.technique(gltf, function(technique) {
       if (defined(technique.program)) {
           usedProgramIds[technique.program] = true;
       }
    });

    removeUnusedElements(gltf, 'program', usedProgramIds);
    return gltf;
};

/**
 * Remove all unused images in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused images.
 */
RemoveUnusedProperties.removeImages = function(gltf) {
    var usedImageIds = {};

    ForEach.texture(gltf, function(texture) {
        if (defined(texture.source)) {
            usedImageIds[texture.source] = true;
        }
    });

    removeUnusedElements(gltf, 'image', usedImageIds);
};

/**
 * Remove all unused samplers in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused samplers.
 */
RemoveUnusedProperties.removeSamplers = function(gltf) {
    var usedSamplerIds = {};

    ForEach.texture(gltf, function(texture) {
        if (defined(texture.sampler)) {
            usedSamplerIds[texture.sampler] = true;
        }
    });

    removeUnusedElements(gltf, 'sampler', usedSamplerIds);
    return gltf;
};

/**
 * Remove all unused shaders in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused shaders.
 */
RemoveUnusedProperties.removeShaders = function(gltf) {
    var usedShaderIds = {};

    ForEach.program(gltf, function(program) {
        if (defined(program.vertexShader)) {
           usedShaderIds[program.vertexShader] = true;
        }
        if (defined(program.fragmentShader)) {
            usedShaderIds[program.fragmentShader] = true;
        }
    });

    removeUnusedElements(gltf, 'shader', usedShaderIds);
    return gltf;
};

/**
 * Removes references to primitive attributes that aren't defined in the primitive material's technique.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed unused primitive attributes.
 */
RemoveUnusedProperties.removePrimitiveAttributes = function(gltf) {
    var materials = gltf.materials;
    var techniques = gltf.techniques;

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitives(mesh, function(primitive) {
            var usedAttributes = {};
            var hasAttributes = false;
            /* jshint unused:vars */
            ForEach.meshPrimitiveAttributes(primitive, function(accessorId, semantic) {
                usedAttributes[semantic] = false;
                hasAttributes = true;
            });
            if (hasAttributes) {
                var materialId = primitive.material;
                if (defined(materialId)) {
                    var material = materials[materialId];
                    var techniqueId = material.technique;
                    if (defined(techniqueId)) {
                        var technique = techniques[techniqueId];
                        ForEach.techniqueParameter(technique, function (parameter) {
                            if (defined(parameter.semantic)) {
                                usedAttributes[parameter.semantic] = true;
                            }
                        });
                    }
                }
                for (var semantic in usedAttributes) {
                    if (usedAttributes.hasOwnProperty(semantic)) {
                        if (!usedAttributes[semantic]) {
                            delete primitive.attributes[semantic];
                        }
                    }
                }
            }
        });
    });

    return gltf;
};