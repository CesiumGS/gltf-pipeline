'use strict';
var Cesium = require('cesium');
var addToArray = require('./addToArray');
var ForEach = require('./ForEach');
var getAccessorByteStride = require('./getAccessorByteStride');
var hasExtension = require('./hasExtension');

var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = addDefaults;

/**
 * Adds default glTF values if they don't exist.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The modified glTF.
 */
function addDefaults(gltf) {
    ForEach.accessor(gltf, function(accessor) {
        accessor.byteOffset = defaultValue(accessor.byteOffset, 0);
    });

    ForEach.bufferView(gltf, function(bufferView) {
        bufferView.byteOffset = defaultValue(bufferView.byteOffset, 0);
    });

    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            primitive.mode = defaultValue(primitive.mode, WebGLConstants.TRIANGLES);
        });
    });

    ForEach.accessorContainingVertexAttributeData(gltf, function(accessorId) {
        var accessor = gltf.accessors[accessorId];
        var bufferViewId = accessor.bufferView;
        accessor.normalized = defaultValue(accessor.normalized, false);
        if (defined(bufferViewId)) {
            var bufferView = gltf.bufferViews[bufferViewId];
            bufferView.byteStride = getAccessorByteStride(gltf, accessor);
            bufferView.target = WebGLConstants.ARRAY_BUFFER;
        }
    });

    ForEach.accessorContainingIndexData(gltf, function(accessorId) {
        var accessor = gltf.accessors[accessorId];
        var bufferViewId = accessor.bufferView;
        if (defined(bufferViewId)) {
            var bufferView = gltf.bufferViews[bufferViewId];
            bufferView.target = WebGLConstants.ELEMENT_ARRAY_BUFFER;
        }
    });

    ForEach.material(gltf, function(material) {
        var extensions = defaultValue(material.extensions, defaultValue.EMPTY_OBJECT);
        var materialsCommon = extensions.KHR_materials_common;
        if (defined(materialsCommon)) {
            var technique = materialsCommon.technique;
            var values = defined(materialsCommon.values) ? materialsCommon.values : {};
            materialsCommon.values = values;

            values.ambient = defined(values.ambient) ? values.ambient : [0.0, 0.0, 0.0, 1.0];
            values.emission = defined(values.emission) ? values.emission : [0.0, 0.0, 0.0, 1.0];

            values.transparency = defaultValue(values.transparency, 1.0);
            values.transparent = defaultValue(values.transparent, false);
            values.doubleSided = defaultValue(values.doubleSided, false);

            if (technique !== 'CONSTANT') {
                values.diffuse = defined(values.diffuse) ? values.diffuse : [0.0, 0.0, 0.0, 1.0];
                if (technique !== 'LAMBERT') {
                    values.specular = defined(values.specular) ? values.specular : [0.0, 0.0, 0.0, 1.0];
                    values.shininess = defaultValue(values.shininess, 0.0);
                }
            }
            return;
        }

        material.emissiveFactor = defaultValue(material.emissiveFactor, [0.0, 0.0, 0.0]);
        material.alphaMode = defaultValue(material.alphaMode, 'OPAQUE');
        material.doubleSided = defaultValue(material.doubleSided, false);

        if (material.alphaMode === 'MASK') {
            material.alphaCutoff = defaultValue(material.alphaCutoff, 0.5);
        }

        // TODO: KHR_techniques_webgl - add defaults for textures inside material values
        addTextureDefaults(material.emissiveTexture);
        addTextureDefaults(material.normalTexture);
        addTextureDefaults(material.occlusionTexture);

        var pbrMetallicRoughness = material.pbrMetallicRoughness;
        if (defined(pbrMetallicRoughness)) {
            pbrMetallicRoughness.baseColorFactor = defaultValue(pbrMetallicRoughness.baseColorFactor, [1.0, 1.0, 1.0, 1.0]);
            pbrMetallicRoughness.metallicFactor = defaultValue(pbrMetallicRoughness.metallicFactor, 1.0);
            pbrMetallicRoughness.roughnessFactor = defaultValue(pbrMetallicRoughness.roughnessFactor, 1.0);
            addTextureDefaults(pbrMetallicRoughness.baseColorTexture);
            addTextureDefaults(pbrMetallicRoughness.metallicRoughnessTexture);
        }

        var pbrSpecularGlossiness = extensions.pbrSpecularGlossiness;
        if (defined(pbrSpecularGlossiness)) {
            pbrSpecularGlossiness.diffuseFactor = defaultValue(pbrSpecularGlossiness.diffuseFactor, [1.0, 1.0, 1.0, 1.0]);
            pbrSpecularGlossiness.specularFactor = defaultValue(pbrSpecularGlossiness.specularFactor, [1.0, 1.0, 1.0]);
            pbrSpecularGlossiness.glossinessFactor = defaultValue(pbrSpecularGlossiness.glossinessFactor, 1.0);
            addTextureDefaults(pbrSpecularGlossiness.specularGlossinessTexture);
        }
    });

    ForEach.animation(gltf, function(animation) {
        ForEach.animationSampler(animation, function(sampler) {
            sampler.interpolation = defaultValue(sampler.interpolation, 'LINEAR');
        });
    });

    var animatedNodes = getAnimatedNodes(gltf);
    ForEach.node(gltf, function(node, id) {
        var animated = defined(animatedNodes[id]);
        if (animated || defined(node.translation) || defined(node.rotation) || defined(node.scale)) {
            node.translation = defaultValue(node.translation, [0.0, 0.0, 0.0]);
            node.rotation = defaultValue(node.rotation, [0.0, 0.0, 0.0, 1.0]);
            node.scale = defaultValue(node.scale, [1.0, 1.0, 1.0]);
        } else {
            node.matrix = defaultValue(node.matrix, [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]);
        }
    });

    ForEach.sampler(gltf, function(sampler) {
        sampler.wrapS = defaultValue(sampler.wrapS, WebGLConstants.REPEAT);
        sampler.wrapT = defaultValue(sampler.wrapT, WebGLConstants.REPEAT);
    });

    if (defined(gltf.scenes) && !defined(gltf.scene)) {
        gltf.scene = 0;
    }

    if (hasExtension(gltf, 'KHR_technique_webgl')) {
        // TODO KHR_techniques_webgl: setting these defaults will need to move to the 1.0->2.0 code in updateVersion
        // glTF 1.0 style materials
        addDefaultMaterial(gltf);
        addDefaultTechnique(gltf);
    }
    return gltf;
}

var defaultMaterial = {
    values: {
        emission: [
            0.5, 0.5, 0.5, 1.0
        ]
    }
};

var defaultTechnique = {
    attributes: {
        a_position: 'position'
    },
    parameters: {
        modelViewMatrix: {
            semantic: 'MODELVIEW',
            type: WebGLConstants.FLOAT_MAT4
        },
        projectionMatrix: {
            semantic: 'PROJECTION',
            type: WebGLConstants.FLOAT_MAT4
        },
        emission: {
            type: WebGLConstants.FLOAT_VEC4,
            value: [
                0.5, 0.5, 0.5, 1.0
            ]
        },
        position: {
            semantic: 'POSITION',
            type: WebGLConstants.FLOAT_VEC3
        }
    },
    states: {
        enable: [
            WebGLConstants.CULL_FACE,
            WebGLConstants.DEPTH_TEST
        ]
    },
    uniforms: {
        u_modelViewMatrix: 'modelViewMatrix',
        u_projectionMatrix: 'projectionMatrix',
        u_emission: 'emission'
    }
};

var defaultProgram = {
    attributes: [
        'a_position'
    ]
};

var defaultVertexShader = {
    type: WebGLConstants.VERTEX_SHADER,
    extras: {
        _pipeline: {
            source:
            'precision highp float;\n' +
            'uniform mat4 u_modelViewMatrix;\n' +
            'uniform mat4 u_projectionMatrix;\n' +
            'attribute vec3 a_position;\n' +
            'void main (void)\n' +
            '{\n' +
            '    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);\n' +
            '}\n'
        }
    }
};

var defaultFragmentShader = {
    type: WebGLConstants.FRAGMENT_SHADER,
    extras: {
        _pipeline: {
            source:
            'precision highp float;\n' +
            'uniform vec4 u_emission;\n' +
            'void main(void)\n' +
            '{\n' +
            '    gl_FragColor = u_emission;\n' +
            '}\n'
        }
    }
};

function addDefaultMaterial(gltf) {
    var defaultMaterialId;
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            if (!defined(primitive.material)) {
                if (!defined(defaultMaterialId)) {
                    defaultMaterialId = addToArray(gltf.materials, clone(defaultMaterial, true));
                }
                primitive.material = defaultMaterialId;
            }
        });
    });
}

function addDefaultTechnique(gltf) {
    var defaultTechniqueId;
    ForEach.material(gltf, function(material) {
        var techniqueId = material.technique;
        if (!defined(techniqueId)) {
            if (!defined(defaultTechniqueId)) {
                var technique = clone(defaultTechnique, true);
                defaultTechniqueId = addToArray(gltf.techniques, technique);

                var program = clone(defaultProgram, true);
                technique.program = addToArray(gltf.programs, program);

                var vertexShader = clone(defaultVertexShader, true);
                program.vertexShader = addToArray(gltf.shaders, vertexShader);

                var fragmentShader = clone(defaultFragmentShader, true);
                program.fragmentShader = addToArray(gltf.shaders, fragmentShader);
            }
            material.technique = defaultTechniqueId;
        }
    });
}

function getAnimatedNodes(gltf) {
    var nodes = {};
    ForEach.animation(gltf, function(animation) {
        ForEach.animationChannel(animation, function(channel) {
            var target = channel.target;
            var nodeId = target.node;
            var path = target.path;
            // Ignore animations that target 'weights'
            if (path === 'translation' || path === 'rotation' || path === 'scale') {
                nodes[nodeId] = true;
            }
        });
    });
    return nodes;
}

function addTextureDefaults(texture) {
    if (defined(texture)) {
        texture.texCoord = defaultValue(texture.texCoord, 0);
    }
}
