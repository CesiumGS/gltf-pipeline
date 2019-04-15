'use strict';
const Cesium = require('cesium');
const ForEach = require('./ForEach');
const hasExtension = require('./hasExtension');

const defined = Cesium.defined;

module.exports = removeUnusedElements;

/**
 * Removes unused elements from gltf.
 * This function currently only works for accessors, buffers, and bufferViews.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Array<string>} elementTypes Element types to be removed. Needs to be a subset of
 *          ['node', 'mesh', 'material', 'accessor', 'bufferView', 'buffer'], other items
 *          will be ignored.
 *
 * @private
 */
function removeUnusedElements(gltf, elementTypes) {
    if(elementTypes === undefined) {
        elementTypes = ['node', 'mesh', 'material', 'accessor', 'bufferView', 'buffer'];
    }
    ['mesh', 'node', 'material', 'accessor', 'bufferView', 'buffer'].forEach(function(type) {
        if (elementTypes.includes(type)) {
            removeUnusedElementsByType(gltf, type);
        }
    });
    return gltf;
}

const TypeToGltfElementName = {
    accessor: 'accessors',
    buffer: 'buffers',
    bufferView: 'bufferViews',
    node: 'nodes',
    material: 'materials',
    mesh: 'meshes'
};

function removeUnusedElementsByType(gltf, type) {
    const name = TypeToGltfElementName[type];
    const arrayOfObjects = gltf[name];

    if (defined(arrayOfObjects)) {
        let removed = 0;
        const usedIds = getListOfElementsIdsInUse[type](gltf);
        const length = arrayOfObjects.length;

        for (let i = 0; i < length; ++i) {
            if (!usedIds[i]) {
                Remove[type](gltf, i - removed);
                removed++;
            }
        }
    }
}

/**
 * Contains functions for removing elements from a glTF hierarchy.
 * Since top-level glTF elements are arrays, when something is removed, referring
 * indices need to be updated.
 * @constructor
 *
 * @private
 */
function Remove() {}

Remove.accessor = function(gltf, accessorId) {
    const accessors = gltf.accessors;

    accessors.splice(accessorId, 1);

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            // Update accessor ids for the primitives.
            ForEach.meshPrimitiveAttribute(primitive, function(attributeAccessorId, semantic) {
                if (attributeAccessorId > accessorId) {
                    primitive.attributes[semantic]--;
                }
            });

            // Update accessor ids for the targets.
            ForEach.meshPrimitiveTarget(primitive, function(target) {
                ForEach.meshPrimitiveTargetAttribute(target, function(attributeAccessorId, semantic) {
                    if (attributeAccessorId > accessorId) {
                        target[semantic]--;
                    }
                });
            });
            const indices = primitive.indices;
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
    const buffers = gltf.buffers;

    buffers.splice(bufferId, 1);

    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(bufferView.buffer) && bufferView.buffer > bufferId) {
            bufferView.buffer--;
        }
    });
};

Remove.bufferView = function(gltf, bufferViewId) {
    const bufferViews = gltf.bufferViews;

    bufferViews.splice(bufferViewId, 1);

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView) && accessor.bufferView > bufferViewId) {
            accessor.bufferView--;
        }
    });

    ForEach.shader(gltf, function(shader) {
        if (defined(shader.bufferView) && shader.bufferView > bufferViewId) {
            shader.bufferView--;
        }
    });

    ForEach.image(gltf, function(image) {
        if (defined(image.bufferView) && image.bufferView > bufferViewId) {
            image.bufferView--;
        }
        ForEach.compressedImage(image, function(compressedImage) {
            const compressedImageBufferView = compressedImage.bufferView;
            if (defined(compressedImageBufferView) && compressedImageBufferView > bufferViewId) {
                compressedImage.bufferView--;
            }
        });
    });

    if (hasExtension(gltf, 'KHR_draco_mesh_compression')) {
        ForEach.mesh(gltf, function (mesh) {
            ForEach.meshPrimitive(mesh, function (primitive) {
                if (defined(primitive.extensions) &&
                    defined(primitive.extensions.KHR_draco_mesh_compression)) {
                    if (primitive.extensions.KHR_draco_mesh_compression.bufferView > bufferViewId) {
                        primitive.extensions.KHR_draco_mesh_compression.bufferView--;
                    }
                }
            });
        });
    }
};

Remove.mesh = function(gltf, meshId) {
    const meshes = gltf.meshes;
    meshes.splice(meshId, 1);

    ForEach.node(gltf, function(n) {
        if (defined(n.mesh)) {
            if (n.mesh > meshId) {
                --n.mesh;
            } else if (n.mesh === meshId) {
                // Remove reference to deleted mesh
                delete n.mesh;
            }
        }
    });
};

Remove.node = function(gltf, nodeId) {
    const nodes = gltf.nodes;
    nodes.splice(nodeId, 1);

    // Shift all node references
    ForEach.skin(gltf, function(s) {
        if (s.skeleton) {
            s.skeleton -= s.skeleton > nodeId ? 1 : 0;
        }

        s.joints -= s.joints.map(function(x) {
            return x > nodeId ? x - 1 : x;
        });
    });
    ForEach.animation(gltf, function(animation) {
        if(animation.target && animation.target.node) {
            animation.target.node -= animation.target.node > nodeId ? 1 : 0;
        }
    });
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueUniform(technique, function(uniform) {
            if (defined(uniform.node)) {
                uniform.node -= uniform.node > nodeId ? 1 : 0;
            }
        });
    });
    ForEach.node(gltf, function(n) {
        if (!n.children) {
            return;
        }

        n.children = n.children
            .filter(function(x) {
                return x !== nodeId; // Remove
            })
            .map(function(x) {
                return x > nodeId ? x - 1 : x; // Shift indices
            });
    });
    ForEach.scene(gltf, function(s, i) {
        s.nodes = s.nodes
            .filter(function(x) {
                return x !== nodeId; // Remove
            })
            .map(function(x) {
                return x > nodeId ? x - 1 : x; // Shift indices
            });
    });
};

Remove.material = function(gltf, materialId) {
    const materials = gltf.materials;
    materials.splice(materialId, 1);

    // Shift other material ids
    ForEach.meshPrimitive(gltf, function(p) {
        if (p.material > materialId) {
            --p.material;
        }
    });

    return gltf;
};

/**
 * Contains functions for getting a list of element ids in use by the glTF asset.
 * @constructor
 *
 * @private
 */
function getListOfElementsIdsInUse() {}

getListOfElementsIdsInUse.accessor = function(gltf) {
    // Calculate accessor's that are currently in use.
    const usedAccessorIds = {};

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId) {
                usedAccessorIds[accessorId] = true;
            });
            ForEach.meshPrimitiveTarget(primitive, function(target) {
                ForEach.meshPrimitiveTargetAttribute(target, function(accessorId) {
                    usedAccessorIds[accessorId] = true;
                });
            });
            const indices = primitive.indices;
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
        ForEach.animationSampler(animation, function(sampler) {
            if (defined(sampler.input)) {
                usedAccessorIds[sampler.input] = true;
            }
            if (defined(sampler.output)) {
                usedAccessorIds[sampler.output] = true;
            }
        });
    });

    return usedAccessorIds;
};

getListOfElementsIdsInUse.buffer = function(gltf) {
    // Calculate buffer's that are currently in use.
    const usedBufferIds = {};

    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(bufferView.buffer)) {
            usedBufferIds[bufferView.buffer] = true;
        }
    });

    return usedBufferIds;
};

getListOfElementsIdsInUse.bufferView = function(gltf) {
    // Calculate bufferView's that are currently in use.
    const usedBufferViewIds = {};

    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            usedBufferViewIds[accessor.bufferView] = true;
        }
    });

    ForEach.shader(gltf, function(shader) {
        if (defined(shader.bufferView)) {
            usedBufferViewIds[shader.bufferView] = true;
        }
    });

    ForEach.image(gltf, function(image) {
        if (defined(image.bufferView)) {
            usedBufferViewIds[image.bufferView] = true;
        }
        ForEach.compressedImage(image, function(compressedImage) {
            if (defined(compressedImage.bufferView)) {
                usedBufferViewIds[compressedImage.bufferView] = true;
            }
        });
    });

    if (hasExtension(gltf, 'KHR_draco_mesh_compression')) {
        ForEach.mesh(gltf, function(mesh) {
            ForEach.meshPrimitive(mesh, function(primitive) {
                if (defined(primitive.extensions) &&
                    defined(primitive.extensions.KHR_draco_mesh_compression)) {
                    usedBufferViewIds[primitive.extensions.KHR_draco_mesh_compression.bufferView] = true;
                }
            });
        });
    }

    return usedBufferViewIds;
};

getListOfElementsIdsInUse.mesh = function(gltf) {
    const usedMeshIds = {};
    ForEach.mesh(gltf, function(mesh, i) {
        if (!defined(mesh.primitives) || mesh.primitives.length === 0) {
            usedMeshIds[i] = false;
        }
    });

    ForEach.node(gltf, function(node, i) {
        if (!defined(node.mesh)) {
            return;
        }
        // Mesh marked as empty in previous step?
        const meshIsEmpty = defined(usedMeshIds[node.mesh]);

        if (!meshIsEmpty) {
            usedMeshIds[node.mesh] = true;
        }
    });

    return usedMeshIds;
};

/* Check if node is empty. It is considered empty if neither referencing
 * mesh, camera, extensions and has no children */
function nodeIsEmpty(gltf, node) {
    if (defined(node.mesh) || defined(node.camera) || defined(node.skin)
        || defined(node.weights) || defined(node.extras)
        || (defined(node.extensions) && node.extensions.length !== 0)) {
        return false;
    }

    // Empty if no children or children are all empty nodes
    return !defined(node.children)
        || node.children.filter(function(n) {
            return !nodeIsEmpty(gltf, gltf.nodes[n]);
        }).length === 0;
}

getListOfElementsIdsInUse.node = function(gltf) {
    const usedNodeIds = {};
    ForEach.node(gltf, function(node, nodeId) {
        if (!nodeIsEmpty(gltf, node)) {
            usedNodeIds[nodeId] = true;
        }
    });
    ForEach.skin(gltf, function(s) {
        if (s.skeleton) {
            usedNodeIds[s.skeleton] = true;
        }

        ForEach.joint(s, function(j) {
            usedNodeIds[j] = true;
        });
    });
    ForEach.animation(gltf, function(animation) {
        if(animation.target && animation.target.node) {
            usedNodeIds[animation.target.node] = true;
        }
    });
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueUniform(technique, function(uniform) {
            if (defined(uniform.node)) {
                usedNodeIds[uniform.node] = true;
            }
        });
    });

    ForEach.animation(gltf, function(anim, animId) {
        if (!defined(anim.channels)) {
            return;
        }

        anim.channels.forEach(function(c) {
            if (defined(c.target) && defined(c.target.node)) {
                /* Keep all nodes that are being targeted
                * by an animation */
                usedNodeIds[c.target.node] = true;
            }
        });
    });

    return usedNodeIds;
};

getListOfElementsIdsInUse.material = function(gltf) {
    const usedMaterialIds = {};

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(p) {
            usedMaterialIds[p.material] = true;
        });
    });

    return usedMaterialIds;
};
