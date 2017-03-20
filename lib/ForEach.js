'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = ForEach;


/**
 * Contains traversal functions for processing elements of the glTF hierarchy.
 * @constructor
 */
function ForEach() {}

ForEach.arrayOfObjects = function(arrayOfObjects, handler) {
    if (defined(arrayOfObjects)) {
        for (var i = 0; i < arrayOfObjects.length; i++) {
            var object = arrayOfObjects[i];
            var offset = defaultValue(handler(object, i), 0);
            i += offset;
        }
    }
};

ForEach.topLevel = function(gltf, name, handler) {
    var arrayOfObjects = gltf[name];
    ForEach.arrayOfObjects(arrayOfObjects, handler);
};

ForEach.accessor = function(gltf, handler) {
    ForEach.topLevel(gltf, 'accessors', handler);
};

ForEach.animation = function(gltf, handler) {
    ForEach.topLevel(gltf, 'animations', handler);
};

ForEach.animationSamplers = function(animation, handler) {
    var samplers = animation.samplers;
    if (defined(samplers)) {
        ForEach.arrayOfObjects(samplers, handler);
    }
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

ForEach.material = function(gltf, handler) {
    ForEach.topLevel(gltf, 'materials', handler);
};

ForEach.materialValue = function(material, handler) {
    var values = material.values;
    if (defined(values)) {
        for (var name in values) {
            if (values.hasOwnProperty(name)) {
                handler(values[name], name);
            }
        }
    }
};

ForEach.mesh = function(gltf, handler) {
    ForEach.topLevel(gltf, 'meshes', handler);
};

ForEach.meshPrimitives = function(mesh, handler) {
    var primitives = mesh.primitives;
    if (defined(primitives)) {
        var primitivesLength = primitives.length;
        for (var i = 0; i < primitivesLength; i++) {
            var primitive = primitives[i];
            handler(primitive, i);
        }
    }
};

ForEach.meshPrimitiveAttributes = function(primitive, handler) {
    var attributes = primitive.attributes;
    if (defined(attributes)) {
        for (var semantic in attributes) {
            if (attributes.hasOwnProperty(semantic)) {
                handler(attributes[semantic], semantic);
            }
        }
    }
};

ForEach.node = function(gltf, handler) {
    ForEach.topLevel(gltf, 'nodes', handler);
};

ForEach.nodeInTree = function(gltf, nodeIds, handler) {
    var nodes = gltf.nodes;
    if (defined(nodes)) {
        for (var i = 0; i < nodeIds.length; i++) {
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
    ForEach.topLevel(gltf, 'programs', handler);
};

ForEach.sampler = function(gltf, handler) {
    ForEach.topLevel(gltf, 'samplers', handler);
};

ForEach.scene = function(gltf, handler) {
    ForEach.topLevel(gltf, 'scenes', handler);
};

ForEach.shader = function(gltf, handler) {
    ForEach.topLevel(gltf, 'shaders', handler);
};

ForEach.skin = function(gltf, handler) {
    ForEach.topLevel(gltf, 'skins', handler);
};

ForEach.techniqueAttribute = function(technique, handler) {
    var attributes = technique.attributes;
    if (defined(attributes)) {
        for (var semantic in attributes) {
            if (attributes.hasOwnProperty(semantic)) {
                handler(attributes[semantic], semantic);
            }
        }
    }
};

ForEach.techniqueParameter = function(technique, handler) {
    var parameters = technique.parameters;
    if (defined(parameters)) {
        for (var parameterName in parameters) {
            if (parameters.hasOwnProperty(parameterName)) {
                handler(parameters[parameterName], parameterName);
            }
        }
    }
};

ForEach.technique = function(gltf, handler) {
    ForEach.topLevel(gltf, 'techniques', handler);
};

ForEach.texture = function(gltf, handler) {
    ForEach.topLevel(gltf, 'textures', handler);
};