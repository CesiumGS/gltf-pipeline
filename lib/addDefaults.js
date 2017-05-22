'use strict';
var Cesium = require('cesium');
var getUniqueId = require('./getUniqueId');

var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = addDefaults;

var gltfTemplate = {
    accessors : {
        '*' : {
            byteStride : 0
        }
    },
    animations : {
        '*' : {
            channels : [],
            parameters : {},
            samplers : {
                '*' : {
                    interpolation : 'LINEAR'
                }
            }
        }
    },
    asset : {
        premultipliedAlpha : false,
        profile : {
            api : 'WebGL',
            version : '1.0.3'
        }
    },
    buffers : {
        '*': {
            byteLength: 0,
            type: 'arraybuffer'
        }
    },
    bufferViews: {
        '*': {
            byteLength: 0
        }
    },
    cameras: {},
    images: {},
    materials: {
        '*': {
            values: function(material) {
                var extensions = defaultValue(material.extensions, {});
                var materialsCommon = extensions.KHR_materials_common;
                if (!defined(materialsCommon)) {
                    return {};
                }
            },
            extensions: function(material) {
                var extensions = defaultValue(material.extensions, {});
                var materialsCommon = extensions.KHR_materials_common;
                if (defined(materialsCommon)) {
                    var technique = materialsCommon.technique;
                    var defaults = {
                        ambient: [0.0, 0.0, 0.0, 1.0],
                        doubleSided: false,
                        emission: [0.0, 0.0, 0.0, 1.0],
                        transparency: 1.0,
                        transparent: false
                    };
                    if (technique !== 'CONSTANT') {
                        defaults.diffuse = [0.0, 0.0, 0.0, 1.0];
                        if (technique !== 'LAMBERT') {
                            defaults.specular = [0.0, 0.0, 0.0, 1.0];
                            defaults.shininess = 0.0;
                        }
                    }
                    return {
                        KHR_materials_common: {
                            values: defaults
                        }
                    };
                }
            }
        }
    },
    meshes : {
        '*' : {
            primitives : [
                {
                    attributes : {},
                    mode : WebGLConstants.TRIANGLES
                }
            ]
        }
    },
    nodes : {
        '*' : {
            children : [],
            matrix : function(node) {
                if (!defined(node.translation) && !defined(node.rotation) && !defined(node.scale)) {
                    return [
                        1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0
                    ];
                }
            },
            rotation : function(node) {
                if (defined(node.translation) || defined(node.scale)) {
                    return [0.0, 0.0, 0.0, 1.0];
                }
            },
            scale : function(node) {
                if (defined(node.translation) || defined(node.rotation)) {
                    return [1.0, 1.0, 1.0];
                }
            },
            translation : function(node) {
                if (defined(node.rotation) || defined(node.scale)) {
                    return [0.0, 0.0, 0.0];
                }
            }
        }
    },
    programs : {
        '*' : {
            attributes : []
        }
    },
    samplers : {
        '*' : {
            magFilter: WebGLConstants.LINEAR,
            minFilter : WebGLConstants.NEAREST_MIPMAP_LINEAR,
            wrapS : WebGLConstants.REPEAT,
            wrapT : WebGLConstants.REPEAT
        }
    },
    scenes : {
        '*' : {
            nodes : []
        }
    },
    shaders : {},
    skins : {
        '*' : {
            bindShapeMatrix : [
                1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            ]
        }
    },
    techniques : {
        '*' : {
            parameters: {},
            attributes: {},
            uniforms: {},
            states: {
                '*': {
                    enable: []
                }
            }
        }
    },
    textures : {
        '*' : {
            format: WebGLConstants.RGBA,
            internalFormat: WebGLConstants.RGBA,
            target: WebGLConstants.TEXTURE_2D,
            type: WebGLConstants.UNSIGNED_BYTE
        }
    },
    extensionsUsed : []
};

function addDefaultsFromTemplate(object, template) {
    for (var id in template) {
        if (template.hasOwnProperty(id)) {
            var templateValue = template[id];
            if (typeof templateValue === 'function') {
                templateValue = templateValue(object);
            }
            if (defined(templateValue)) {
                if (typeof templateValue === 'object') {
                    if (Array.isArray(templateValue)) {
                        var arrayValue = defaultValue(object[id], []);
                        if (templateValue.length > 0) {
                            var arrayTemplate = templateValue[0];
                            if (typeof arrayTemplate === 'object') {
                                var arrayValueLength = arrayValue.length;
                                for (var i = 0; i < arrayValueLength; i++) {
                                    addDefaultsFromTemplate(arrayValue[i], arrayTemplate);
                                }
                            } else {
                                arrayValue = defaultValue(object[id], templateValue);
                            }
                        }
                        object[id] = arrayValue;
                    } else {
                        var applyTemplate = templateValue['*'];
                        object[id] = defaultValue(object[id], {});
                        var objectValue = object[id];
                        if (defined(applyTemplate)) {
                            for (var subId in objectValue) {
                                if (objectValue.hasOwnProperty(subId) && subId !== 'extras') {
                                    var subObject = objectValue[subId];
                                    addDefaultsFromTemplate(subObject, applyTemplate);
                                }
                            }
                        } else {
                            addDefaultsFromTemplate(objectValue, templateValue);
                        }
                    }
                } else {
                    object[id] = defaultValue(object[id], templateValue);
                }
            }
        }
    }
}

var defaultTechnique = {
    attributes : {
        a_position : 'position'
    },
    parameters : {
        modelViewMatrix : {
            semantic : 'MODELVIEW',
            type : WebGLConstants.FLOAT_MAT4
        },
        projectionMatrix : {
            semantic : 'PROJECTION',
            type : WebGLConstants.FLOAT_MAT4
        },
        emission : {
            type : WebGLConstants.FLOAT_VEC4,
            value : [
                0.5, 0.5, 0.5, 1.0
            ]
        },
        position : {
            semantic: 'POSITION',
            type: WebGLConstants.FLOAT_VEC3
        }
    },
    states : {
        enable : [
            WebGLConstants.CULL_FACE,
            WebGLConstants.DEPTH_TEST
        ]
    },
    uniforms : {
        u_modelViewMatrix : 'modelViewMatrix',
        u_projectionMatrix : 'projectionMatrix',
        u_emission : 'emission'
    }
};

var defaultProgram = {
    attributes : [
        'a_position'
    ]
};

var defaultVertexShader = {
    type : WebGLConstants.VERTEX_SHADER,
    extras : {
        _pipeline : {
            source : '' +
                'precision highp float;\n' +
                '\n' +
                'uniform mat4 u_modelViewMatrix;\n' +
                'uniform mat4 u_projectionMatrix;\n' +
                '\n' +
                'attribute vec3 a_position;\n' +
                '\n' +
                'void main (void)\n' +
                '{\n' +
                '    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);\n' +
                '}\n'
        }
    }
};

var defaultFragmentShader = {
    type : WebGLConstants.FRAGMENT_SHADER,
    extras : {
        _pipeline : {
            extension : '.vert',
            source : '' +
                'precision highp float;\n' +
                '\n' +
                'uniform vec4 u_emission;\n' +
                '\n' +
                'void main(void)\n' +
                '{\n' +
                '    gl_FragColor = u_emission;\n' +
                '}\n'
        }
    }
};

function addDefaultTechnique(gltf) {
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    var programs = gltf.programs;
    var shaders = gltf.shaders;

    var defaultTechniqueId;
    var defaultProgramId;
    var defaultVertexShaderId;
    var defaultFragmentShaderId;

    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var techniqueId = material.technique;
            var extensions = defaultValue(material.extensions, {});
            var materialsCommon = extensions.KHR_materials_common;
            if (!defined(techniqueId)) {
                if (!defined(defaultTechniqueId) && !defined(materialsCommon)) {
                    defaultTechniqueId = getUniqueId(gltf, 'defaultTechnique');
                    defaultProgramId = getUniqueId(gltf, 'defaultProgram');
                    defaultVertexShaderId = getUniqueId(gltf, 'defaultVertexShader');
                    defaultFragmentShaderId = getUniqueId(gltf, 'defaultFragmentShader');

                    var technique = clone(defaultTechnique, true);
                    techniques[defaultTechniqueId] = technique;
                    technique.program = defaultProgramId;

                    var program = clone(defaultProgram, true);
                    programs[defaultProgramId] = program;
                    program.vertexShader = defaultVertexShaderId;
                    program.fragmentShader = defaultFragmentShaderId;

                    var vertexShader = clone(defaultVertexShader, true);
                    shaders[defaultVertexShaderId] = vertexShader;

                    var fragmentShader = clone(defaultFragmentShader, true);
                    shaders[defaultFragmentShaderId] = fragmentShader;
                }
                material.technique = defaultTechniqueId;
            }
        }
    }
}

function isTechniqueShared(gltf, techniqueId) {
    var referenced = false;
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            if (material.technique === techniqueId) {
                if (referenced) {
                    return true;
                }
                referenced = true;
            }
        }
    }
    return false;
}

function makeTechniqueTransparent(technique) {
    technique.states = {
        enable: [
            WebGLConstants.DEPTH_TEST,
            WebGLConstants.BLEND
        ],
        depthMask: false,
        functions: {
            blendEquationSeparate: [
                WebGLConstants.FUNC_ADD,
                WebGLConstants.FUNC_ADD
            ],
            blendFuncSeparate: [
                WebGLConstants.ONE,
                WebGLConstants.ONE_MINUS_SRC_ALPHA,
                WebGLConstants.ONE,
                WebGLConstants.ONE_MINUS_SRC_ALPHA
            ]
        }
    };
}

function enableDiffuseTransparency(gltf) {
    var materials = gltf.materials;
    var techniques = gltf.techniques;

    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            if (defined(material.values) && defined(material.values.diffuse)) {
                // Check if the diffuse texture/color is transparent
                var diffuse = material.values.diffuse;
                var diffuseTransparent = false;
                if (typeof diffuse === 'string') {
                    diffuseTransparent = gltf.images[gltf.textures[diffuse].source].extras._pipeline.transparent;
                } else {
                    diffuseTransparent = diffuse[3] < 1.0;
                }

                var techniqueId = material.technique;
                var technique = techniques[techniqueId];
                var blendingEnabled = technique.states.enable.indexOf(WebGLConstants.BLEND) > -1;

                // Override the technique's states if blending isn't already enabled
                if (diffuseTransparent && !blendingEnabled) {
                    if (isTechniqueShared(gltf, techniqueId)) {
                        var transparentTechniqueId = techniqueId + '_transparent';
                        if (!defined(techniques[transparentTechniqueId])) {
                            technique = clone(technique, true);
                            makeTechniqueTransparent(technique);
                            gltf.techniques[transparentTechniqueId] = technique;
                        }
                        material.technique = transparentTechniqueId;
                    } else {
                        makeTechniqueTransparent(technique);
                    }
                }
            }
        }
    }
}

function optimizeForCesium(gltf) {
    // Give the diffuse uniform a semantic to support color replacement in 3D Tiles
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var parameters = technique.parameters;
            if (defined(parameters.diffuse)) {
                parameters.diffuse.semantic = '_3DTILESDIFFUSE';
            }
        }
    }
}

/**
 * Adds default glTF values if they don't exist.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] An object with the following properties:
 * @param {Boolean} [options.optimizeForCesium] Optimize the defaults for Cesium. Uses the Cesium sun as the default light source.
 * @returns {Object} The modified glTF.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function addDefaults(gltf, options) {
    options = defaultValue(options, {});
    addDefaultsFromTemplate(gltf, gltfTemplate);
    addDefaultTechnique(gltf);
    enableDiffuseTransparency(gltf);
    if (options.optimizeForCesium) {
        optimizeForCesium(gltf);
    }
    return gltf;
}
