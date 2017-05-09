'use strict';
var Cesium = require('cesium');
var addExtensionsRequired = require('./addExtensionsRequired');
var addToArray = require('./addToArray');
var findAccessorMinMax = require('./findAccessorMinMax');
var ForEach = require('./ForEach');

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Quaternion = Cesium.Quaternion;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = updateVersion;

var updateFunctions = {
    '0.8' : glTF08to10,
    '1.0' : glTF10to20,
    '2.0' : undefined
};

/**
 * Update the glTF version to the latest version (2.0), or targetVersion if specified.
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
    // invalid version
    if (!updateFunctions.hasOwnProperty(version)) {
        // try truncating trailing version numbers, could be a number as well if it is 0.8
        if (defined(version)) {
            version = ('' + version).substring(0, 3);
        }
        // default to 1.0 if it cannot be determined
        if (!updateFunctions.hasOwnProperty(version)) {
            version = '1.0';
        }
    }

    var updateFunction = updateFunctions[version];

    while (defined(updateFunction)) {
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
        gltf.allExtensions = undefined;
    }
}

function removeAnimationSamplersIndirection(gltf) {
    var animations = gltf.animations;
    for (var animationId in animations) {
        if (animations.hasOwnProperty(animationId)) {
            var animation = animations[animationId];
            var parameters = animation.parameters;
            if (defined(parameters)) {
                var samplers = animation.samplers;
                for (var samplerId in samplers) {
                    if (samplers.hasOwnProperty(samplerId)) {
                        var sampler = samplers[samplerId];
                        sampler.input = parameters[sampler.input];
                        sampler.output = parameters[sampler.output];
                    }
                }
                delete animation.parameters;
            }
        }
    }
}


function objectToArray(object, mapping) {
    var array = [];
    for (var id in object) {
        if (object.hasOwnProperty(id)) {
            var value = object[id];
            mapping[id] = array.length;
            array.push(value);
            if (!defined(value.name)) {
                value.name = id;
            }
        }
    }
    return array;
}

function objectsToArrays(gltf) {
    var i;
    var globalMapping = {
        accessors: {},
        animations: {},
        bufferViews: {},
        buffers: {},
        cameras: {},
        materials: {},
        meshes: {},
        nodes: {},
        programs: {},
        shaders: {},
        skins: {},
        techniques: {}
    };
    // Convert top level objects to arrays
    for (var topLevelId in gltf) {
        if (gltf.hasOwnProperty(topLevelId) && topLevelId !== 'extras' && topLevelId !== 'asset') {
            var objectMapping = {};
            var object = gltf[topLevelId];
            if (typeof(object) === 'object' && !Array.isArray(object)) {
                gltf[topLevelId] = objectToArray(object, objectMapping);
                globalMapping[topLevelId] = objectMapping;
                if (topLevelId === 'animations') {
                    objectMapping = {};
                    object.samplers = objectToArray(object.samplers, objectMapping);
                    globalMapping[topLevelId].samplers = objectMapping;
                }
            }
        }
    }
    // Fix references
    if (defined(gltf.scene)) {
        gltf.scene = globalMapping.scenes[gltf.scene];
    }
    ForEach.bufferView(gltf, function(bufferView) {
        if (defined(bufferView.buffer)) {
            bufferView.buffer = globalMapping.buffers[bufferView.buffer];
        }
    });
    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.bufferView)) {
            accessor.bufferView = globalMapping.bufferViews[accessor.bufferView];
        }
    });
    ForEach.shader(gltf, function(shader) {
        var extensions = shader.extensions;
        if (defined(extensions)) {
            var binaryGltf = extensions.KHR_binary_glTF;
            if (defined(binaryGltf)) {
                shader.bufferView = globalMapping.bufferViews[binaryGltf.bufferView];
                delete extensions.KHR_binary_glTF;
            }
            if (Object.keys(extensions).length === 0) {
                delete shader.extensions;
            }
        }
    });
    ForEach.program(gltf, function(program) {
        if (defined(program.vertexShader)) {
            program.vertexShader = globalMapping.shaders[program.vertexShader];
        }
        if (defined(program.fragmentShader)) {
            program.fragmentShader = globalMapping.shaders[program.fragmentShader];
        }
    });
    ForEach.technique(gltf, function(technique) {
        if (defined(technique.program)) {
            technique.program = globalMapping.programs[technique.program];
        }
        ForEach.techniqueParameter(technique, function(parameter) {
            if (defined(parameter.node)) {
                parameter.node = globalMapping.nodes[parameter.node];
            }
            var value = parameter.value;
            if (defined(value)) {
                if (Array.isArray(value)) {
                    if (value.length === 1) {
                        var textureId = value[0];
                        if (typeof textureId === 'string') {
                            value[0] = globalMapping.textures[textureId];
                        }
                    }
                }
                else if (typeof value === 'string') {
                    parameter.value = [globalMapping.textures[value]];
                }
            }
        });
    });
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            if (defined(primitive.indices)) {
                primitive.indices = globalMapping.accessors[primitive.indices];
            }
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
                primitive.attributes[semantic] = globalMapping.accessors[accessorId];
            });
            if (defined(primitive.material)) {
                primitive.material = globalMapping.materials[primitive.material];
            }
        });
    });
    ForEach.skin(gltf, function(skin) {
        if (defined(skin.inverseBindMatrices)) {
            skin.inverseBindMatrices = globalMapping.accessors[skin.inverseBindMatrices];
        }
    });
    ForEach.node(gltf, function(node) {
        var children = node.children;
        if (defined(children)) {
            var childrenLength = children.length;
            for (i = 0; i < childrenLength; i++) {
                children[i] = globalMapping.nodes[children[i]];
            }
        }
        if (defined(node.meshes)) {
            // Split out meshes on nodes
            var meshes = node.meshes;
            var meshesLength = meshes.length;
            if (meshesLength > 0) {
                node.mesh = globalMapping.meshes[meshes[0]];
                for (i = 1; i < meshesLength; i++) {
                    var meshNode = {
                        mesh: globalMapping.meshes[meshes[i]],
                        extras: {
                            _pipeline: {}
                        }
                    };
                    var meshNodeId = addToArray(gltf.nodes, meshNode);
                    if (!defined(children)) {
                        children = [];
                        node.children = children;
                    }
                    children.push(meshNodeId);
                }
            }
            delete node.meshes;
        }
        if (defined(node.camera)) {
            node.camera = globalMapping.cameras[node.camera];
        }
        if (defined(node.skeletons)) {
            // Split out skeletons on nodes
            var skeletons = node.skeletons;
            var skeletonsLength = skeletons.length;
            if (skeletonsLength > 0) {
                node.skeleton = globalMapping.nodes[skeletons[0]];
                for (i = 1; i < skeletonsLength; i++) {
                    var skeletonNode = {
                        skeleton: globalMapping.nodes[skeletons[i]]
                    };
                    var skeletonNodeId = addToArray(gltf.nodes, skeletonNode);
                    if (!defined(children)) {
                        children = [];
                        node.children = children;
                    }
                    children.push(skeletonNodeId);
                }
            }
            delete node.skeletons;
        }
        if (defined(node.skin)) {
            node.skin = globalMapping.skins[node.skin];
        }
    });
    ForEach.scene(gltf, function(scene) {
        var sceneNodes = scene.nodes;
        if (defined(sceneNodes)) {
            var sceneNodesLength = sceneNodes.length;
            for (i = 0; i < sceneNodesLength; i++) {
                sceneNodes[i] = globalMapping.nodes[sceneNodes[i]];
            }
        }
    });
    ForEach.animation(gltf, function(animation) {
        var samplerMapping = {};
        animation.samplers = objectToArray(animation.samplers, samplerMapping);
        ForEach.animationSampler(animation, function(sampler) {
            sampler.input = globalMapping.accessors[sampler.input];
            sampler.output = globalMapping.accessors[sampler.output];
        });
        var channels = animation.channels;
        if (defined(channels)) {
            var channelsLength = channels.length;
            for (i = 0; i < channelsLength; i++) {
                var channel = channels[i];
                channel.sampler = samplerMapping[channel.sampler];
                var target = channel.target;
                if (defined(target)) {
                    target.node = globalMapping.nodes[target.id];
                }
            }
        }
    });
    ForEach.material(gltf, function(material) {
        if (defined(material.technique)) {
            material.technique = globalMapping.techniques[material.technique];
        }
        ForEach.materialValue(material, function(value, name) {
            if (Array.isArray(value)) {
                if (value.length === 1) {
                    var textureId = value[0];
                    if (typeof textureId === 'string') {
                        value[0] = globalMapping.textures[textureId];
                    }
                }
            }
            else if (typeof value === 'string') {
                material.values[name] = [globalMapping.textures[value]];
            }
        });
        var extensions = material.extensions;
        if (defined(extensions)) {
            var materialsCommon = extensions.KHR_materials_common;
            if (defined(materialsCommon)) {
                ForEach.materialValue(materialsCommon, function(value, name) {
                    if (Array.isArray(value)) {
                        if (value.length === 1) {
                            var textureId = value[0];
                            if (typeof textureId === 'string') {
                                value[0] = globalMapping.textures[textureId];
                            }
                        }
                    }
                    else if (typeof value === 'string') {
                        materialsCommon.values[name] = [globalMapping.textures[value]];
                    }
                });
            }
        }
    });
    ForEach.image(gltf, function(image) {
        var extensions = image.extensions;
        if (defined(extensions)) {
            var binaryGltf = extensions.KHR_binary_glTF;
            if (defined(binaryGltf)) {
                image.bufferView = globalMapping.bufferViews[binaryGltf.bufferView];
                image.mimeType = binaryGltf.mimeType;
                delete extensions.KHR_binary_glTF;
            }
            if (Object.keys(extensions).length === 0) {
                delete image.extensions;
            }
        }
    });
    ForEach.texture(gltf, function(texture) {
        if (defined(texture.sampler)) {
            texture.sampler = globalMapping.samplers[texture.sampler];
        }
        if (defined(texture.source)) {
            texture.source = globalMapping.images[texture.source];
        }
    });
}

function stripProfile(gltf) {
    var asset = gltf.asset;
    delete asset.profile;
}

var knownExtensions = {
    CESIUM_RTC : true,
    KHR_materials_common : true,
    WEB3D_quantized_attributes : true
};
function requireKnownExtensions(gltf) {
    var extensionsUsed = gltf.extensionsUsed;
    gltf.extensionsRequired = defaultValue(gltf.extensionsRequired, []);
    if (defined(extensionsUsed)) {
        var extensionsUsedLength = extensionsUsed.length;
        for (var i = 0; i < extensionsUsedLength; i++) {
            var extension = extensionsUsed[i];
            if (defined(knownExtensions[extension])) {
                gltf.extensionsRequired.push(extension);
            }
        }
    }
}

function removeBufferType(gltf) {
    ForEach.buffer(gltf, function(buffer) {
        delete buffer.type;
    });
}

function makeMaterialValuesArrays(gltf) {
    ForEach.material(gltf, function(material) {
        ForEach.materialValue(material, function(value, name) {
            if (!Array.isArray(value)) {
                material.values[name] = [value];
            }
        });
    });
}

function requireAttributeSetIndex(gltf) {
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
                if (semantic === 'TEXCOORD') {
                    primitive.attributes.TEXCOORD_0 = accessorId;
                } else if (semantic === 'COLOR') {
                    primitive.attributes.COLOR_0 = accessorId;
                }
            });
            delete primitive.attributes.TEXCOORD;
            delete primitive.attributes.COLOR;
        });
    });
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter) {
            var semantic = parameter.semantic;
            if (defined(semantic)) {
                if (semantic === 'TEXCOORD') {
                    parameter.semantic = 'TEXCOORD_0';
                } else if (semantic === 'COLOR') {
                    parameter.semantic = 'COLOR_0';
                }
            }
        });
    });
}

var knownSemantics = {
    POSITION: true,
    NORMAL: true,
    TEXCOORD: true,
    COLOR: true,
    JOINT: true,
    WEIGHT: true
};
function underscoreApplicationSpecificSemantics(gltf) {
    var mappedSemantics = {};
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitive(mesh, function(primitive) {
            /* jshint unused:vars */
            ForEach.meshPrimitiveAttribute(primitive, function(accessorId, semantic) {
                if (semantic.charAt(0) !== '_') {
                    var setIndex = semantic.search(/_[0-9]+/g);
                    var strippedSemantic = semantic;
                    if (setIndex >= 0) {
                        strippedSemantic = semantic.substring(0, setIndex);
                    }
                    if (!defined(knownSemantics[strippedSemantic])) {
                        var newSemantic = '_' + semantic;
                        mappedSemantics[semantic] = newSemantic;
                    }
                }
            });
            for (var semantic in mappedSemantics) {
                if (mappedSemantics.hasOwnProperty(semantic)) {
                    var mappedSemantic = mappedSemantics[semantic];
                    var accessorId = primitive.attributes[semantic];
                    delete primitive.attributes[semantic];
                    primitive.attributes[mappedSemantic] = accessorId;
                }
            }
        });
    });
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter) {
            var mappedSemantic = mappedSemantics[parameter.semantic];
            if (defined(mappedSemantic)) {
                parameter.semantic = mappedSemantic;
            }
        });
    });
}

function makeTechniqueValuesArrays(gltf) {
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter) {
            var value = parameter.value;
            if (defined(value) && !Array.isArray(value)) {
                parameter.value = [value];
            }
        });
    });
}

function removeScissorFromTechniques(gltf) {
    ForEach.technique(gltf, function(technique) {
        var techniqueStates = technique.states;
        if (defined(techniqueStates)) {
            var techniqueFunctions = techniqueStates.functions;
            if (defined(techniqueFunctions)) {
                delete techniqueFunctions.scissor;
            }
            var enableStates = techniqueStates.enable;
            if (defined(enableStates)) {
                var scissorIndex = enableStates.indexOf(WebGLConstants.SCISSOR_TEST);
                if (scissorIndex >= 0) {
                    enableStates.splice(scissorIndex, 1);
                }
            }
        }
    });
}

function clampTechniqueFunctionStates(gltf) {
    ForEach.technique(gltf, function(technique) {
        var techniqueStates = technique.states;
        if (defined(techniqueStates)) {
            var functions = techniqueStates.functions;
            if (defined(functions)) {
                var blendColor = functions.blendColor;
                if (defined(blendColor)) {
                    for (var i = 0; i < 4; i++) {
                        blendColor[i] = CesiumMath.clamp(blendColor[i], 0.0, 1.0);
                    }
                }
                var depthRange = functions.depthRange;
                if (defined(depthRange)) {
                    depthRange[1] = CesiumMath.clamp(depthRange[1], 0.0, 1.0);
                    depthRange[0] = CesiumMath.clamp(depthRange[0], 0.0, depthRange[1]);
                }
            }
        }
    });
}

function clampCameraParameters(gltf) {
    ForEach.camera(gltf, function(camera) {
        var perspective = camera.perspective;
        if (defined(perspective)) {
            var aspectRatio = perspective.aspectRatio;
            if (defined(aspectRatio) && aspectRatio === 0.0) {
                delete perspective.aspectRatio;
            }
            var yfov = perspective.yfov;
            if (defined(yfov) && yfov === 0.0) {
                perspective.yfov = 1.0;
            }
        }
    });
}

function requireByteLength(gltf) {
    ForEach.buffer(gltf, function(buffer) {
        if (!defined(buffer.byteLength)) {
            buffer.byteLength = buffer.extras._pipeline.source.length;
        }
    });
    ForEach.bufferView(gltf, function(bufferView) {
        if (!defined(bufferView.byteLength)) {
            var bufferViewBufferId = bufferView.buffer;
            var bufferViewBuffer = gltf.buffers[bufferViewBufferId];
            bufferView.byteLength = bufferViewBuffer.byteLength;
        }
    });
}

function moveByteStrideToBufferView(gltf) {
    ForEach.accessor(gltf, function(accessor) {
        if (defined(accessor.byteStride)) {
            var byteStride = accessor.byteStride;
            if (byteStride !== 0) {
                var bufferView = gltf.bufferViews[accessor.bufferView];
                if (defined(bufferView.byteStride) && bufferView.byteStride !== byteStride) {
                    // another accessor uses this with a different byte stride
                    bufferView = clone(bufferView);
                    accessor.bufferView = addToArray(gltf.bufferViews, bufferView);
                }
                bufferView.byteStride = byteStride;
            }
            delete accessor.byteStride;
        }
    });
}

function requireAccessorMinMax(gltf) {
    ForEach.accessor(gltf, function(accessor) {
        if (!defined(accessor.min) || !defined(accessor.max)) {
            var minMax = findAccessorMinMax(gltf, accessor);
            accessor.min = minMax.min;
            accessor.max = minMax.max;
        }
    });
}

function stripTechniqueAttributeValues(gltf) {
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueAttribute(technique, function(attribute) {
            var parameter = technique.parameters[attribute];
            if (defined(parameter.value)) {
                delete parameter.value;
            }
        });
    });
}

function stripTechniqueParameterCount(gltf) {
    ForEach.technique(gltf, function(technique) {
        ForEach.techniqueParameter(technique, function(parameter) {
            if (defined(parameter.count)) {
                var semantic = parameter.semantic;
                if (!defined(semantic) || (semantic !== 'JOINTMATRIX' && semantic.indexOf('_') !== 0)) {
                    delete parameter.count;
                }
            }
        });
    });
}

function addKHRTechniqueExtension(gltf) {
    var techniques = gltf.techniques;
    if (defined(techniques) && techniques.length > 0) {
        addExtensionsRequired(gltf, 'KHR_technique_webgl');
    }
}

function glTF10to20(gltf) {
    if (!defined(gltf.asset)) {
        gltf.asset = {};
    }
    var asset = gltf.asset;
    asset.version = '2.0';
    // animation.samplers now refers directly to accessors and animation.parameters should be removed
    removeAnimationSamplersIndirection(gltf);
    // top-level objects are now arrays referenced by index instead of id
    objectsToArrays(gltf);
    // asset.profile no longer exists
    stripProfile(gltf);
    // move known extensions from extensionsUsed to extensionsRequired
    requireKnownExtensions(gltf);
    // bufferView.byteLength and buffer.byteLength are required
    requireByteLength(gltf);
    // byteStride moved from accessor to bufferView
    moveByteStrideToBufferView(gltf);
    // accessor.min and accessor.max must be defined
    requireAccessorMinMax(gltf);
    // buffer.type is unnecessary and should be removed
    removeBufferType(gltf);
    // TEXCOORD and COLOR attributes must be written with a set index (TEXCOORD_#)
    requireAttributeSetIndex(gltf);
    // Add underscores to application-specific parameters
    underscoreApplicationSpecificSemantics(gltf);
    // material.values should be arrays
    makeMaterialValuesArrays(gltf);
    // technique.parameters.value should be arrays
    makeTechniqueValuesArrays(gltf);
    // remove scissor from techniques
    removeScissorFromTechniques(gltf);
    // clamp technique function states to min/max
    clampTechniqueFunctionStates(gltf);
    // clamp camera parameters
    clampCameraParameters(gltf);
    // a technique parameter specified as an attribute cannot have a value
    stripTechniqueAttributeValues(gltf);
    // only techniques with a JOINTMATRIX or application specific semantic may have a defined count property
    stripTechniqueParameterCount(gltf);
    // add KHR_technique_webgl extension
    addKHRTechniqueExtension(gltf);
}
