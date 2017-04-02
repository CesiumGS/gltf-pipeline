'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');
var isTexture = require('./isTexture');

var defined = Cesium.defined;

module.exports = Remove;

/**
 * Contains functions for removing elements from a glTF hierarchy.
 * Since top-level glTF elements are arrays, when something is removed, referring
 * indices need to be updated.
 * @constructor
 */
function Remove() {}

Remove.accessor = function(gltf, accessorId) {
    var accessors = gltf.accessors;

    accessors.splice(accessorId, 1);

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(attributeAccessorId, semantic) {
                if (attributeAccessorId > accessorId) {
                    primitive.attributes[semantic]--;
                }
            });
            var indices = primitive.indices;
            if (defined(indices) && indices > accessorId) {
                primitive.indices--;
            }
        });
    });

    ForEach.skin(gltf, function(skin) {
        if (defined(skin.inverseBindMatrices) && skin.inverseBindMatrices > accessorId) {
            skin.inverseBindMatrices--;
        }
    });

    ForEach.animation(gltf, function(animation) {
        ForEach.animationSampler(animation, function(sampler) {
            if (defined(sampler.input) && sampler.input > accessorId) {
                sampler.input--;
            }
            if (defined(sampler.output) && sampler.output > accessorId) {
                sampler.output--;
            }
        });
    });
};

Remove.buffer = function(gltf, bufferId) {
    var buffers = gltf.buffers;

    buffers.splice(bufferId, 1);

    ForEach.bufferView(gltf, function(bufferView) {
       if (defined(bufferView.buffer) && bufferView.buffer > bufferId) {
           bufferView.buffer--;
       }
    });
};

Remove.bufferView = function(gltf, bufferViewId) {
    var bufferViews = gltf.bufferViews;

    bufferViews.splice(bufferViewId, 1);

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView) && accessor.bufferView > bufferViewId) {
            accessor.bufferView--;
        }
    });
};

Remove.camera = function(gltf, cameraId) {
    var cameras = gltf.cameras;

    cameras.splice(cameraId, 1);

    ForEach.node(gltf, function(node) {
       if (defined(node.camera) && node.camera > cameraId) {
           node.camera--;
       }
    });
};

Remove.image = function(gltf, imageId) {
    var images = gltf.images;

    images.splice(imageId, 1);

    ForEach.texture(gltf, function(texture) {
        if (defined(texture.source) && texture.source > imageId) {
            texture.source--;
        }
    });
};

Remove.material = function(gltf, materialId) {
    var materials = gltf.materials;

    materials.splice(materialId, 1);

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            if (defined(primitive.material) && primitive.material > materialId) {
                primitive.material--;
            }
        });
    });
};

Remove.mesh = function(gltf, meshId) {
    var meshes = gltf.meshes;

    meshes.splice(meshId, 1);

    ForEach.node(gltf, function(node) {
        if (defined(node.mesh) && node.mesh > meshId) {
            node.mesh--;
        }
    });
};

Remove.node = function(gltf, nodeId) {
    var nodes = gltf.nodes;

    nodes.splice(nodeId, 1);

    ForEach.node(gltf, function(node) {
        var children = node.children;
        if (defined(children)) {
            var childrenLength = children.length;
            for (var i = 0; i < childrenLength; i++) {
                var childId = children[i];
                if (childId > nodeId) {
                    children[i]--;
                }
            }
        }
        var skeletons = node.skeletons;
        if (defined(skeletons)) {
            var skeletonsLength = skeletons.length;
            for (var j = 0; j < skeletonsLength; j++) {
                var skeletonId = skeletons[j];
                if (skeletonId > nodeId) {
                    skeletons[j]--;
                }
            }
        }
    });

    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(value) {
            if (defined(value.node) && value.node > nodeId) {
                value.node--;
            }
        });
    });

    ForEach.scene(gltf, function(scene) {
        var sceneNodeIds = scene.nodes;
        if (defined(sceneNodeIds)) {
            var sceneNodeIdsLength = sceneNodeIds.length;
            for (var k = 0; k < sceneNodeIdsLength; k++) {
                var sceneNodeId = sceneNodeIds[k];
                if (sceneNodeId > nodeId) {
                    sceneNodeIds[k]--;
                }
            }
        }
    });
};

Remove.program = function(gltf, programId) {
    var programs = gltf.programs;

    programs.splice(programId, 1);

    ForEach.technique(gltf, function(technique) {
        if (defined(technique.program) && technique.program > programId) {
            technique.program--;
        }
    });
};

Remove.sampler = function(gltf, samplerId) {
    var samplers = gltf.samplers;

    samplers.splice(samplerId, 1);

    ForEach.texture(gltf, function(texture) {
       if (defined(texture.sampler) && texture.sampler > samplerId) {
           texture.sampler--;
       }
    });
};

Remove.shader = function(gltf, shaderId) {
    var shaders = gltf.shaders;

    shaders.splice(shaderId, 1);

    ForEach.program(gltf, function(program) {
        if (defined(program.vertexShader) && program.vertexShader > shaderId) {
            program.vertexShader--;
        }
        if (defined(program.fragmentShader) && program.fragmentShader > shaderId) {
            program.fragmentShader--;
        }
    });
};

Remove.skin = function(gltf, skinId) {
    var skins = gltf.skins;

    skins.splice(skinId, 1);

    ForEach.node(gltf, function(node) {
        if (defined(node.skin) && node.skin > skinId) {
            node.skin--;
        }
    });
};

Remove.technique = function(gltf, techniqueId) {
    var techniques = gltf.techniques;

    techniques.splice(techniqueId, 1);

    ForEach.material(gltf, function(material) {
        if (defined(material.technique) && material.technique > techniqueId) {
            material.technique--;
        }
    });
};

Remove.texture = function(gltf, textureId) {
    var textures = gltf.textures;

    textures.splice(textureId, 1);

    ForEach.material(gltf, function(material) {
        ForEach.materialValue(material, function(value, name) {
            if (isTexture(name, value)) {
                if (value[0] > textureId) {
                    value[0]--;
                }
            }
        });
    });

    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter, name) {
            var value = parameter.value;
            if (defined(value)) {
                if (isTexture(name, value)) {
                    if (value[0] > textureId) {
                        value[0]--;
                    }
                }
            }
        });
    });
};