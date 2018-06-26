'use strict';
var Cesium = require('cesium');
var hasExtension = require('./hasExtension.js');

var defined = Cesium.defined;
var isArray = Cesium.isArray;

module.exports = ForEach;

/**
 * Contains traversal functions for processing elements of the glTF hierarchy.
 * @constructor
 *
 * @private
 */
function ForEach() {
}

/**
 * Fallback for glTF 1.0
 * @private
 */
ForEach.objectLegacy = function(objects, handler) {
    if (defined(objects)) {
        for (var objectId in objects) {
            if (objects.hasOwnProperty(objectId)) {
                var object = objects[objectId];
                handler(object, objectId);
            }
        }
    }
};

/**
 * @private
 */
ForEach.object = function(arrayOfObjects, handler) {
    if (defined(arrayOfObjects)) {
        var length = arrayOfObjects.length;
        for (var i = 0; i < length; i++) {
            var object = arrayOfObjects[i];
            handler(object, i);
        }
    }
};

/**
 * Supports glTF 1.0 and 2.0
 * @private
 */
ForEach.topLevel = function(gltf, name, handler) {
    var gltfProperty = gltf[name];
    if (defined(gltfProperty) && !isArray(gltfProperty)) {
        ForEach.objectLegacy(gltfProperty, handler);
    } else {
        ForEach.object(gltfProperty, handler);
    }
};

ForEach.accessor = function(gltf, handler) {
    ForEach.topLevel(gltf, 'accessors', handler);
};

ForEach.accessorWithSemantic = function(gltf, semantic, handler) {
    var visited = {};
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId, attributeSemantic) {
                if (attributeSemantic.indexOf(semantic) === 0 && !defined(visited[accessorId])) {
                    visited[accessorId] = true;
                    handler(accessorId);
                }
            });
            ForEach.meshPrimitiveTarget(primitive, function(target) {
                ForEach.meshPrimitiveTargetAttribute(target, function(accessorId, attributeSemantic) {
                    if (attributeSemantic.indexOf(semantic) === 0 && !defined(visited[accessorId])) {
                        visited[accessorId] = true;
                        handler(accessorId);
                    }
                });
            });
        });
    });
};

ForEach.accessorContainingVertexAttributeData = function(gltf, handler) {
    var visited = {};
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function (primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId) {
                if (!defined(visited[accessorId])) {
                    visited[accessorId] = true;
                    handler(accessorId);
                }
            });
            ForEach.meshPrimitiveTarget(primitive, function(target) {
                ForEach.meshPrimitiveTargetAttribute(target, function(accessorId) {
                    if (!defined(visited[accessorId])) {
                        visited[accessorId] = true;
                        handler(accessorId);
                    }
                });
            });
        });
    });
};

ForEach.accessorContainingIndexData = function(gltf, handler) {
    var visited = {};
    ForEach.mesh(gltf, function (mesh) {
        ForEach.meshPrimitive(mesh, function (primitive) {
            var indices = primitive.indices;
            if (defined(indices) && !defined(visited[indices])) {
                visited[indices] = true;
                handler(indices);
            }
        });
    });
};

ForEach.animation = function(gltf, handler) {
    ForEach.topLevel(gltf, 'animations', handler);
};

ForEach.animationChannel = function(animation, handler) {
    var channels = animation.channels;
    ForEach.object(channels, handler);
};

ForEach.animationSampler = function(animation, handler) {
    var samplers = animation.samplers;
    ForEach.object(samplers, handler);
};

ForEach.buffer = function(gltf, handler) {
    ForEach.topLevel(gltf, 'buffers', handler);
};

ForEach.bufferView = function(gltf, handler) {
    ForEach.topLevel(gltf, 'bufferViews', handler);
};

ForEach.camera = function(gltf, handler) {
    ForEach.topLevel(gltf, 'cameras', handler);
};

ForEach.image = function(gltf, handler) {
    ForEach.topLevel(gltf, 'images', handler);
};

ForEach.compressedImage = function(image, handler) {
    if (defined(image.extras)) {
        var compressedImages = image.extras.compressedImage3DTiles;
        for (var type in compressedImages) {
            if (compressedImages.hasOwnProperty(type)) {
                var compressedImage = compressedImages[type];
                handler(compressedImage, type);
            }
        }
    }
};

ForEach.material = function(gltf, handler) {
    ForEach.topLevel(gltf, 'materials', handler);
};

ForEach.materialValue = function(material, handler) {
    var values = material.values;
    if (defined(material.extensions) && defined(material.extensions.KHR_techniques_webgl)) {
        values = material.extensions.KHR_techniques_webgl.values;
    }

    for (var name in values) {
        if (values.hasOwnProperty(name)) {
            handler(values[name], name);
        }
    }
};

ForEach.mesh = function(gltf, handler) {
    ForEach.topLevel(gltf, 'meshes', handler);
};

ForEach.meshPrimitive = function(mesh, handler) {
    var primitives = mesh.primitives;
    if (defined(primitives)) {
        var primitivesLength = primitives.length;
        for (var i = 0; i < primitivesLength; i++) {
            var primitive = primitives[i];
            handler(primitive, i);
        }
    }
};

ForEach.meshPrimitiveAttribute = function(primitive, handler) {
    var attributes = primitive.attributes;
    for (var semantic in attributes) {
        if (attributes.hasOwnProperty(semantic)) {
            handler(attributes[semantic], semantic);
        }
    }
};

ForEach.meshPrimitiveTarget = function(primitive, handler) {
    var targets = primitive.targets;
    if (defined(targets)) {
        var length = targets.length;
        for (var i = 0; i < length; ++i) {
            handler(targets[i], i);
        }
    }
};

ForEach.meshPrimitiveTargetAttribute = function(target, handler) {
    for (var semantic in target) {
        if (target.hasOwnProperty(semantic)) {
            var accessorId = target[semantic];
            handler(accessorId, semantic);
        }
    }
};

ForEach.node = function(gltf, handler) {
    ForEach.topLevel(gltf, 'nodes', handler);
};

ForEach.nodeInTree = function(gltf, nodeIds, handler) {
    var nodes = gltf.nodes;
    if (defined(nodes)) {
        var length = nodeIds.length;
        for (var i = 0; i < length; i++) {
            var nodeId = nodeIds[i];
            var node = nodes[nodeId];
            if (defined(node)) {
                handler(node, nodeId);
                var children = node.children;
                if (defined(children)) {
                    ForEach.nodeInTree(gltf, children, handler);
                }
            }
        }
    }
};

ForEach.nodeInScene = function(gltf, scene, handler) {
    var sceneNodeIds = scene.nodes;
    if (defined(sceneNodeIds)) {
        ForEach.nodeInTree(gltf, sceneNodeIds, handler);
    }
};

ForEach.program = function(gltf, handler) {
    if (hasExtension(gltf, 'KHR_techniques_webgl')) {
        ForEach.object(gltf.extensions.KHR_techniques_webgl.programs, handler);
    } else {
        ForEach.topLevel(gltf, 'programs', handler);
    }
};

ForEach.sampler = function(gltf, handler) {
    ForEach.topLevel(gltf, 'samplers', handler);
};

ForEach.scene = function(gltf, handler) {
    ForEach.topLevel(gltf, 'scenes', handler);
};

ForEach.shader = function(gltf, handler) {
    if (hasExtension(gltf, 'KHR_techniques_webgl')) {
        ForEach.object(gltf.extensions.KHR_techniques_webgl.shaders, handler);
    } else {
        ForEach.topLevel(gltf, 'shaders', handler);
    }
};

ForEach.skin = function(gltf, handler) {
    ForEach.topLevel(gltf, 'skins', handler);
};

ForEach.techniqueAttribute = function(technique, handler) {
    var attributes = technique.attributes;
    for (var attributeName in attributes) {
        if (attributes.hasOwnProperty(attributeName)) {
            handler(attributes[attributeName], attributeName);
        }
    }
};

ForEach.techniqueUniform = function(technique, handler) {
    var uniforms = technique.uniforms;
    for (var uniformName in uniforms) {
        if (uniforms.hasOwnProperty(uniformName)) {
            handler(uniforms[uniformName], uniformName);
        }
    }
};

ForEach.techniqueParameter = function(technique, handler) {
    var parameters = technique.parameters;
    for (var parameterName in parameters) {
        if (parameters.hasOwnProperty(parameterName)) {
            handler(parameters[parameterName], parameterName);
        }
    }
};

ForEach.technique = function(gltf, handler) {
    if (hasExtension(gltf, 'KHR_techniques_webgl')) {
        ForEach.object(gltf.extensions.KHR_techniques_webgl.techniques, handler);
    } else {
        ForEach.topLevel(gltf, 'techniques', handler);
    }
};

ForEach.texture = function(gltf, handler) {
    ForEach.topLevel(gltf, 'textures', handler);
};
