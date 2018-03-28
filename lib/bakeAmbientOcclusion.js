'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var baryCentricCoordinates = Cesium.barycentricCoordinates;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;
var Ray = Cesium.Ray;
var ShaderSource = Cesium.ShaderSource;
var WebGLConstants = Cesium.WebGLConstants;
var IntersectionTests = Cesium.IntersectionTests;

var GeometryMath = require('./GeometryMath');
var getUniqueId = require('./getUniqueId');
var Jimp = require('jimp');
var NodeHelpers = require('./NodeHelpers');
var readAccessor = require('./readAccessor');
var StaticUniformGrid = require('./StaticUniformGrid');

var scratchRay = new Ray();
var barycentricCoordinateScratch = new Cartesian3();
var worldPositionScratch = new Cartesian3();
var worldNormalScratch = new Cartesian3();
var cartesian2Scratch = new Cartesian2();
var quaternionScratch = new Quaternion();
var matrix3Scratch = new Matrix3();
var matrix4Scratch = new Matrix4();
var trianglePixelMarchScratch = new TrianglePixelMarchOptions();
var computeAmbientOcclusionAtScratch = new ComputeAmbientOcclusionAtOptions();

module.exports = bakeAmbientOcclusion;

/**
 * Bakes ambient occlusion (AO) to all models in a specific scene of the glTF asset.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [aoOptions] All options for baking AO including a glTF asset with extras and AO parameters
 *
 * Basic options:
 * @param {Boolean} [aoOptions.toTexture=false] Bake AO to existing diffuse textures instead of to vertices. Does not modify shaders.
 * @param {Boolean} [aoOptions.groundPlane=false] Add a groundplane at the lowest point of the model for AO computation.
 * @param {Boolean} [aoOptions.ambientShadowContribution=0.5] Amount of AO to show when blending between shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend.
 * @param {String} [aoOptions.quality='low'] Valid settings are high, medium, and low.
 *
 * Advanced quality options:
 * @param {Number} [aoOptions.density=1.0] For vertex baking mode, sample count per unit length at which to generate additional sample points. High: 4.0, medium: 2.0, low: 1.0
 * @param {Number} [aoOptions.resolution=128] For texture baking mode, resolution at which to generate an AO texture. AO texture will be scaled to diffuse texture. High: 512, medium: 256, low: 128.
 * @param {Number} [aoOptions.numberRays=16] Number of rays to cast from each sample point. Clamps to nearest smaller square. High: 64, medium: 36, low: 16.
 * @param {Boolean} [aoOptions.triangleCenterOnly=false] For vertex baking mode, only sample a triangle's center as opposed to its area using a grid.
 *
 * Advanced appearance settings:
 * @param {Number} [aoOptions.rayDistance] Ray bottom-out distance in world-space units. Default: 20% of the model's smallest Axis Aligned Bounding Box dimension.
 * @param {Number} [aoOptions.nearCull=0.0001] Near cull depth for ray-triangle collisions. Specified in scene space coordinates.
 * @param {String} [aoOptions.shaderMode='blend'] How should the shader use per-vertex AO? Valid settings are multiply, replace, and blend.
 * @param {String} [aoOptions.scene=gltf.scene] Which scene to use when baking AO.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function bakeAmbientOcclusion(gltf, aoOptions) {
    var options = generateOptions(gltf, aoOptions);

    ////// Generate triangle soup //////
    // Requires each mesh to occur only once in the scene
    var scene = gltf.scenes[options.sceneID];
    var raytracerScene = generateRaytracerScene(gltf, options);

    ////// Raytrace for each primitive and add to the gltf //////
    var parameters = {
        raytracerScene: raytracerScene,
        resolution: options.resolution,
        density: options.density
    };

    if (options.toTexture) {
        NodeHelpers.forEachPrimitiveInScene(gltf, scene, raytraceToTexels, parameters);
        bakeToTexture(gltf, {
            scene : scene,
            resolution : options.resolution,
            aoBufferByPrimitive : raytracerScene.aoBufferByPrimitive
        });
    } else {
        NodeHelpers.forEachPrimitiveInScene(gltf, scene, raytraceAtTriangleCenters, parameters);
        if (!options.triangleCenterOnly) {
            NodeHelpers.forEachPrimitiveInScene(gltf, scene, raytraceOverTriangleSamples, parameters);
        }
        bakeToVertices(gltf, {
            scene : scene,
            aoBufferByPrimitive : raytracerScene.aoBufferByPrimitive,
            shaderMode : options.shaderMode,
            ambientShadowContribution : options.ambientShadowContribution
        });
    }
}

bakeAmbientOcclusion._generateOptions = generateOptions;
bakeAmbientOcclusion._generateRaytracerScene = generateRaytracerScene;
bakeAmbientOcclusion._computeAmbientOcclusionAt = computeAmbientOcclusionAt;
bakeAmbientOcclusion._raytraceAtTriangleCenters = raytraceAtTriangleCenters;
bakeAmbientOcclusion._raytraceOverTriangleSamples = raytraceOverTriangleSamples;
bakeAmbientOcclusion._extractInstructionWithFunctionCall = extractInstructionWithFunctionCall;
bakeAmbientOcclusion._injectGlslAfterInstructionContaining = injectGlslAfterInstructionContaining;

function generateOptions(gltf, aoOptions) {
    var options = {
        toTexture: false,
        groundPlane: false,
        ambientShadowContribution: 0.5,
        density: 1.0,
        resolution: 128,
        numberRays: 16,
        triangleCenterOnly: false,
        rayDistance : -1.0, // indicates that rayDistance must be computed
        nearCull : 0.0001,
        shaderMode : 'blend',
        sceneID : gltf.scene
    };

    if (defined(aoOptions)) {
        options.toTexture = defaultValue(aoOptions.toTexture, options.toTexture);
        options.groundPlane = defaultValue(aoOptions.groundPlane, options.groundPlane);
        options.ambientShadowContribution = defaultValue(aoOptions.ambientShadowContribution, options.ambientShadowContribution);
        var quality = aoOptions.quality;

        // Change quality settings to match requested base quality, if not medium
        if (quality === 'high') {
            options.density = 4.0;
            options.resolution = 512;
            options.numberRays = 64;
        } else if (quality === 'medium') {
            options.density = 2.0;
            options.resolution = 256;
            options.numberRays = 36;
        }
        options.density = defaultValue(aoOptions.density, options.density);
        options.resolution = defaultValue(aoOptions.resolution, options.resolution);
        options.numberRays = defaultValue(aoOptions.numberRays, options.numberRays);
        options.triangleCenterOnly = defaultValue(aoOptions.triangleCenterOnly, options.triangleCenterOnly);

        options.rayDistance = defaultValue(aoOptions.rayDistance, options.rayDistance );
        options.nearCull = defaultValue(aoOptions.nearCull, options.nearCull);
        options.shaderMode = defaultValue(aoOptions.shaderMode, options.shaderMode);
        options.sceneID = defaultValue(aoOptions.scene, options.sceneID);
    }

    if (!defined(options.sceneID)) {
        throw new DeveloperError('No scene specified, and gltf has no default scene.');
    }
    return options;
}

////////// adding to the gltf by vertex //////////

// helper for bakeToVertices
function checkShadingChain(primitive, meshPrimitiveID, parameters) {
    if (parameters.aoBufferByPrimitive.hasOwnProperty(meshPrimitiveID)) {
        var materialID = primitive.material;
        var techniqueID = parameters.materials[materialID].technique;
        var programID = parameters.techniques[techniqueID].program;
        var program = parameters.programs[programID];
        var fragmentShaderID = program.fragmentShader;
        var vertexShaderID = program.vertexShader;

        parameters.materialCloneIDs[materialID] = '';
        parameters.techniqueCloneIDs[techniqueID] = '';
        parameters.programCloneIDs[programID] = '';
        parameters.vertexShaderCloneIDs[vertexShaderID] = '';
        parameters.fragmentShaderCloneIDs[fragmentShaderID] = '';
    }
}

function cloneJsonAsNeeded(id, cloneIds, items) {
    var cloneID = cloneIds[id];
    if (defined(cloneID)) {
        if (cloneID === '') { // No clone exists yet. Make one!
            cloneID = id + "_noAO";
            items[cloneID] = clone(items[id]);
            cloneIds[id] = cloneID;
        }
        return cloneID;
    }
    return id;
}

function cloneShadingChain(primitive, meshPrimitiveID, parameters) {
    // Only clone if a primitive that won't have AO still depends on these gltf items.
    if (!parameters.aoBufferByPrimitive.hasOwnProperty(meshPrimitiveID)) {
        var materials = parameters.materials;
        var techniques = parameters.techniques;
        var programs = parameters.programs;
        var shaders = parameters.shaders;

        // For each item in the shading chain, clone it if no clone exists.
        var materialID = primitive.material;
        primitive.material = cloneJsonAsNeeded(materialID, parameters.materialCloneIDs, materials);

        var material = materials[primitive.material];
        material.technique = cloneJsonAsNeeded(material.technique, parameters.techniqueCloneIDs, techniques);

        var technique = techniques[material.technique];
        technique.program = cloneJsonAsNeeded(technique.program, parameters.programCloneIDs, programs);

        var program = programs[technique.program];
        program.vertexShader = cloneJsonAsNeeded(program.vertexShader, parameters.vertexShaderCloneIDs, shaders);
        program.fragmentShader = cloneJsonAsNeeded(program.fragmentShader, parameters.fragmentShaderCloneIDs, shaders);
    }
}

function bakeToVertices(gltf, options) {
    var scene = options.scene;
    var aoBufferByPrimitive = options.aoBufferByPrimitive;

    // Add the new vertex data to the buffers along with bufferViews and accessors
    addVertexData(gltf, {
        scene : scene,
        aoBufferByPrimitive : aoBufferByPrimitive
    });

    // Build lists of shaders, techniques, and primitives that need to be edited.
    // Basically, edit anything used by a primitive that has AO data lying around.
    // If anything is used by a primitive that doesn't have per-vertex AO, clone it first.
    var parameters = {
        aoBufferByPrimitive: aoBufferByPrimitive,
        materials: gltf.materials,
        techniques: gltf.techniques,
        programs: gltf.programs,
        shaders: gltf.shaders,
        // Use the keys to keep track of what needs editing.
        // If an item gets cloned, store the clone's name as the value.
        materialCloneIDs: {},
        techniqueCloneIDs: {},
        programCloneIDs: {},
        vertexShaderCloneIDs: {},
        fragmentShaderCloneIDs: {}
    };

    NodeHelpers.forEachPrimitiveInScene(gltf, scene, checkShadingChain, parameters);

    // Clone materials, techniques, programs, and shaders as needed by primitives in other scenes.
    var sceneIDs = gltf.scenes;
    for (var otherSceneID in sceneIDs) {
        if (sceneIDs.hasOwnProperty(otherSceneID)) {
            var otherScene = sceneIDs[otherSceneID];
            NodeHelpers.forEachPrimitiveInScene(gltf, otherScene, cloneShadingChain, parameters);
        }
    }

    // Edit the shaders.
    // This can mean tracking down the unlit diffuse color input from the technique.
    addAoToShaders(gltf, {
        techniqueIds : Object.keys(parameters.techniqueCloneIDs),
        shaderMode : options.shaderMode,
        ambientShadowContribution : options.ambientShadowContribution
    });

    // Edit the programs: add the ao attribute
    var programCloneIds = parameters.programCloneIDs;
    for (var programID in programCloneIds) {
        if (programCloneIds.hasOwnProperty(programID)) {
            gltf.programs[programID].attributes.push('a_ambientOcclusion');
        }
    }

    var techniqueCloneIds = parameters.techniqueCloneIDs;
    // Edit the techniques: add ao to attributes, add ao to parameters
    for (var techniqueID in techniqueCloneIds) {
        if (techniqueCloneIds.hasOwnProperty(techniqueID)) {
            var technique = gltf.techniques[techniqueID];
            technique.attributes.a_ambientOcclusion = 'vertex_ao';
            technique.parameters.vertex_ao = {
                semantic: '_OCCLUSION',
                type: WebGLConstants.FLOAT
            };
        }
    }
}

// Helper for addVertexData
function concatenateAoBuffers(primitive, meshPrimitiveID, parameters) {
    if (parameters.aoBufferByPrimitive.hasOwnProperty(meshPrimitiveID)) {
        var aoBuffer = parameters.aoBufferByPrimitive[meshPrimitiveID];
        var vertexCount = aoBuffer.samples.length;
        var samples = aoBuffer.samples;
        var counts = aoBuffer.count;
        for (var i = 0; i < vertexCount; i++) {
            samples[i] = 1.0 - (samples[i]/counts[i]);
        }
        parameters.allAOData = parameters.allAOData.concat(samples);
        parameters.primitiveOrder.push(primitive);
        parameters.primitiveNames.push(meshPrimitiveID);
        parameters.primitiveVertexCounts.push(vertexCount);
    }
}

function addVertexData(gltf, options) {
    var scene = options.scene;
    var aoBufferByPrimitive = options.aoBufferByPrimitive;

    // Get all the ao vertex data together, ordered parallel with the vertex data
    // - append all the aoBuffers from the primitives
    // - record the order for the accessors
    var parameters = {
        aoBufferByPrimitive: aoBufferByPrimitive,
        primitiveOrder: [],
        primitiveNames: [],
        primitiveVertexCounts: [],
        allAOData: []
    };

    NodeHelpers.forEachPrimitiveInScene(gltf, scene, concatenateAoBuffers, parameters);

    var primitiveOrder = parameters.primitiveOrder;
    var allAOData = parameters.allAOData;
    var allAODataLength = allAOData.length;

    var aoBufferId = getUniqueId(gltf, 'aoBuffer');

    gltf.buffers[aoBufferId] = {
        type: 'arraybuffer',
        extras: {
            _pipeline: {
                source: Buffer.from(new Float32Array(allAOData).buffer),
                extension: '.bin'
            }
        }
    };

    // add buffer view
    var aoBufferViewId = getUniqueId(gltf, 'aoBufferView');

    gltf.bufferViews[aoBufferViewId] = {
        buffer: aoBufferId,
        byteOffset: 0,
        byteLength: allAODataLength * 4,
        target: WebGLConstants.ARRAY_BUFFER
    };

    // add accessor for each primitive
    var primitiveCount = primitiveOrder.length;
    var byteOffset = 0;
    for (var i = 0; i < primitiveCount; i++) {
        var primitive = primitiveOrder[i];
        var primitiveVertexCount = parameters.primitiveVertexCounts[i];
        var name = 'accessor_' + parameters.primitiveNames[i] + '_AO';
        primitive.attributes._OCCLUSION = name;
        gltf.accessors[name] = {
            bufferView: aoBufferViewId,
            byteOffset: byteOffset,
            componentType: WebGLConstants.FLOAT,
            count: primitiveVertexCount,
            type: 'SCALAR'
        };
        byteOffset += primitiveVertexCount * 4;
    }
}

function addAoToShaders(gltf, options) {
    var techniqueIds = options.techniqueIds;
    var shaderMode = options.shaderMode;
    var ambientShadowContribution = options.ambientShadowContribution;

    // Keep track of which shaders have been edited
    var shaders = gltf.shaders;
    var shadersEdited = {};
    for (var shaderID in shaders) {
        if (shaders.hasOwnProperty(shaderID)) {
            shadersEdited[shaderID] = false;
        }
    }

    // For each technique,
    var techniquesCount = techniqueIds.length;
    for (var i = 0; i < techniquesCount; i++) {
        var technique = gltf.techniques[techniqueIds[i]];
        var program = gltf.programs[technique.program];

        var glslNewAttributes = 'attribute float a_ambientOcclusion; \n'; // snippet for adding attributes
        var glslNewVaryings = 'varying float v_ambientOcclusion; \n'; // snippet for adding varying
        var glslPassThrough = 'v_ambientOcclusion = a_ambientOcclusion; \n'; // snippet for passing values from vs to fs
        var glslChangeColor; // snippet for editing the final glsl color
        var glslDiffuseColor; // snippet for accessing the diffuse color

        if (shaderMode !== 'multiply') {
            // Check for a diffuse uniform and note if it's a texture or a term
            var diffuseParameter = technique.parameters.diffuse;
            if (!defined(diffuseParameter)) {
                throw new DeveloperError('Could not find parameter diffuse in technique ' + techniqueIds[i]);
            }

            var uniforms = technique.uniforms;
            // Fetch the uniform name for the diffuse uniform
            for (var uniformName in uniforms) {
                if (uniforms.hasOwnProperty(uniformName)) {
                    if (uniforms[uniformName] === 'diffuse') {
                        glslDiffuseColor = uniformName;
                        break;
                    }
                }
            }
            if (diffuseParameter.type === WebGLConstants.SAMPLER_2D) {
                // Add new code to the shader for caching the diffuse color to a vec3.
                // Use a vec3 because `vec3(someVec4)` and `vec3(someVec3)` are both valid glsl.
                // Locate the instruction declaring the texture uniform. Inject a global vec3 before it
                var shader = shaders[program.fragmentShader];
                injectGlslAfterInstructionContaining({
                    shader : shader,
                    lines : ['\nvec3 diffuseForAmbientOcclusion; \n'],
                    snippet : glslDiffuseColor
                });
                // Find the function call that gets the diffuse color.
                var diffuseTextureInstruction = extractInstructionWithFunctionCall({
                    shader : shader,
                    functionName : 'texture2D',
                    functionArguments : [glslDiffuseColor] // at this point, this is the uniform for the diffuse texture.
                });
                if (!defined(diffuseTextureInstruction)) {
                    throw new DeveloperError('Could not find a texture2D function call using diffuse texture uniform in shader ' + program.fragmentShader);
                }
                // Inject code to save the diffuse color value
                var texture2DAssigneeName = '';
                var leftHandTokens = diffuseTextureInstruction.split('=')[0].trim().split(/\s* /);
                if (leftHandTokens.length === 1) {
                    texture2DAssigneeName = leftHandTokens[0].trim(); // example: `diffuse = texture2D(uniform, texcoord);`
                } else {
                    texture2DAssigneeName = leftHandTokens[1].trim(); // example: `vec4 diffuse = texture2D(uniform, texcoord);`
                }
                injectGlslAfterInstructionContaining({
                    shader : shader,
                    lines : ['\n    diffuseForAmbientOcclusion = vec3(' + texture2DAssigneeName + '); \n'],
                    snippet : diffuseTextureInstruction
                });
                glslDiffuseColor = 'diffuseForAmbientOcclusion';
            }
            glslDiffuseColor += '.rgb';
        }

        switch(shaderMode) {
            case 'multiply':
                glslChangeColor = 'gl_FragColor.rgb *= v_ambientOcclusion; \n';
                break;
            case 'replace':
                glslChangeColor = 'gl_FragColor.rgb = v_ambientOcclusion * ' + glslDiffuseColor + '; \n';
                break;
            default: // mix
                glslChangeColor = 'gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.a * v_ambientOcclusion * ' +
                    glslDiffuseColor + ', ' + ambientShadowContribution + '); \n';
                break;
        }

        // Replace the shaders in the gltf
        if (!shadersEdited[program.vertexShader]) {
            shadersEdited[program.vertexShader] = true;
            editShader({
                shader: shaders[program.vertexShader],
                newVaryingsAttributes: glslNewAttributes + glslNewVaryings,
                mainNewName: 'mainBeforeAO',
                commandsForNewMain: glslPassThrough
            });
        }
        if (!shadersEdited[program.fragmentShader]) {
            shadersEdited[program.fragmentShader] = true;
            editShader({
                shader: shaders[program.fragmentShader],
                newVaryingsAttributes: glslNewVaryings,
                mainNewName: 'mainBeforeAO',
                commandsForNewMain: glslChangeColor
            });
        }
    }
}

function extractInstructionWithFunctionCall(options) {
    var functionName = options.functionName;
    var functionArguments = options.functionArguments;
    var functionArgumentsLength = functionArguments.length;
    var sourceString = options.shader.extras._pipeline.source;
    var instructions = sourceString.trim().split(/~|;|{|}/); // split not by whitespace but by ;, {, and }
    var instructionCount = instructions.length;

    for (var i = 0; i < instructionCount; i++) {
        var instruction = instructions[i];
        var missingArgs = true;
        var indexOfFunctionCall = instruction.indexOf(functionName);

        // Check for the function call
        if (indexOfFunctionCall >= 0) {
            missingArgs = false;
            // Check for the function call arguments
            for (var j = 0; j < functionArgumentsLength; j++) {
                if (instruction.indexOf(functionArguments[j]) < 0) {
                    missingArgs = true;
                    break;
                }
            }
        }
        if (missingArgs === false) {
            return instruction;
        }
    }
}

// Inject new glsl after the first line containing options.snippet
function injectGlslAfterInstructionContaining(options) {
    var shader = options.shader;
    var lines = options.lines;
    var snippet = options.snippet;

    var sourceString = shader.extras._pipeline.source;
    var sourceStringLength = sourceString.length;
    // Locate the instruction containing the snippet. Find the nearest `;`
    var snippetIndex = sourceString.indexOf(snippet);
    var subSourceString = sourceString.substring(snippetIndex, sourceStringLength);
    var instructionEndIndex = snippetIndex + subSourceString.indexOf(';') + 1;
    var newSourceString = sourceString.substring(0, instructionEndIndex);

    // Add each of the new lines after.
    var numberLines = lines.length;
    for (var i = 0; i < numberLines; i++) {
        newSourceString += lines[i];
    }
    newSourceString += sourceString.substring(instructionEndIndex, sourceStringLength);

    // Repack into source
    shader.extras._pipeline.source = newSourceString;
}

function editShader(options) {
    var shader = options.shader;
    var newVaryingsAttributes = options.newVaryingsAttributes;
    var mainNewName = options.mainNewName;
    var commandsForNewMain = options.commandsForNewMain;

    var sourceString = shader.extras._pipeline.source;
    // Wrap main
    sourceString = ShaderSource.replaceMain(sourceString, mainNewName);
    var newSourceString = '';

    newSourceString += sourceString;
    newSourceString += newVaryingsAttributes;
    newSourceString += '\n' +
        'void main() \n' +
        '{ \n' +
        '    ' + mainNewName + '(); \n';
    newSourceString += '    ' + commandsForNewMain;
    newSourceString +='}';

    // Repack into source
    shader.extras._pipeline.source = newSourceString;
}

////////// adding to the gltf by texture //////////

function bakeToTexture(gltf, options) {
    // find material with a diffuse texture parameter to clone as needed
    var scene = options.scene;
    var resolution = options.resolution;
    var aoBufferByPrimitive = options.aoBufferByPrimitive;

    var materials = gltf.materials;
    var textures = gltf.textures;

    var exampleMaterialID;
    var exampleTextureID;
    var exampleImageID;

    for (var materialID in materials) {
        if (materials.hasOwnProperty(materialID)) {
            var material = materials[materialID];
            if (defined(material.values) && defined(material.values.diffuse)) {
                if (typeof material.values.diffuse === 'string') {
                    exampleMaterialID = materialID;
                    exampleTextureID = material.values.diffuse;
                    exampleImageID = textures[exampleTextureID].source;
                    break;
                }
            }
        }
    }

    if (!defined(exampleMaterialID)) {
        throw new DeveloperError('Could not find any materials with a diffuse texture.');
    }

    // Build a hash of materials, textures, and images we've seen so far to ensure uniqueness
    var parameters = {
        materialsSeen: {},
        texturesSeen: {},
        imagesSeen: {},
        exampleMaterialID: exampleMaterialID,
        exampleTextureID: exampleTextureID,
        exampleImageID: exampleImageID,
        resolution: resolution,
        gltf: gltf,
        aoBufferByPrimitive: aoBufferByPrimitive
    };

    // Bake AO for each primitive in the scene
    NodeHelpers.forEachPrimitiveInScene(gltf, scene, addAoToImage, parameters);
}

function addAoToImage(primitive, meshPrimitiveID, parameters) {
    // Enforce material/texture/image uniqueness
    var gltf = parameters.gltf;
    var diffuseImage = ensureImageUniqueness(gltf, {
        primitive : primitive,
        meshPrimitiveID : meshPrimitiveID,
        state : parameters
    });
    diffuseImage.extras._pipeline.imageChanged = true;
    var diffuseImageJimp = diffuseImage.extras._pipeline.jimpImage;
    var goalResolution = diffuseImageJimp.bitmap.width;

    // Post process the AO
    var jimpAO = gltf.extras._pipeline.jimpScratch;
    postProcessAO({
        aoBuffer : parameters.aoBufferByPrimitive[meshPrimitiveID],
        dataResolution : parameters.resolution,
        goalResolution : goalResolution,
        jimpAO : jimpAO
    });

    // Modify the diffuse image with AO
    for (var x = 0; x < goalResolution; x++) {
        for (var y = 0; y < goalResolution; y++) {
            var idx = (goalResolution * y + x) * 4;
            var aoValue = 1.0 - (jimpAO.bitmap.data[idx + 3] / 255.0);

            // darken each channel by the ao value
            diffuseImageJimp.bitmap.data[idx] *= aoValue;
            diffuseImageJimp.bitmap.data[idx + 1] *= aoValue;
            diffuseImageJimp.bitmap.data[idx + 2] *= aoValue;
        }
    }
}

function postProcessAO(options) {
    var aoBuffer = options.aoBuffer;
    var dataResolution = options.dataResolution;
    var goalResolution = options.goalResolution;
    var jimpAO = options.jimpAO;

    // Copy the data over to the jimp
    jimpAO.resize(dataResolution, dataResolution);
    for (var x = 0; x < dataResolution; x++) {
        for (var y = 0; y < dataResolution; y++) {
            var dataIdx = dataResolution * y + x;
            var sampleCount = aoBuffer.count[dataIdx];
            var value = 0.0;
            value = 255.0 * (aoBuffer.samples[dataIdx] / sampleCount);
            jimpAO.bitmap.data[dataIdx * 4 + 3] = value;
        }
    }
    // Resize the data to match the goal resolution
    jimpAO.resize(goalResolution, goalResolution, Jimp.RESIZE_BEZIER);
}

function cloneAndSetupMaterialTextureImage(options) {
    var newMaterialID = options.newMaterialID;
    var newTextureID = options.newTextureID;
    var newImageID = options.newImageID;

    var materials = options.materials;
    var textures = options.textures;
    var images = options.images;

    var newImage;
    var newTexture;
    var newMaterial;

    if (defined(newImageID)) {
        var oldImage = images[options.oldImageID];
        if (!defined(oldImage.extras._pipeline.jimpImage)) {
            throw new DeveloperError('gltf pipeline image processing does not currently support the ' + oldImage.extras._pipeline.extension + ' format.');
        }
        newImage = clone(oldImage);
        newImage.extras._pipeline.jimpImage = oldImage.extras._pipeline.jimpImage.clone();
        images[newImageID] = newImage;
    }
    if (defined(newTextureID)) {
        var oldTexture = textures[options.oldTextureID];
        newTexture = clone(oldTexture);
        newTexture.source = newImageID;
        textures[newTextureID] = newTexture;
        if (defined(newMaterialID)) {
            newMaterial = clone(materials[options.oldMaterialID]);
            newMaterial.texture = newTextureID;
            materials[newMaterialID] = newMaterial;
        }
    }
}

// Check and modify the given material to ensure every primitive gets a unique material, texture, and image
function ensureImageUniqueness(gltf, options) {
    var primitive = options.primitive;
    var meshPrimitiveID = options.meshPrimitiveID;
    var state = options.state;

    var materialsSeen = state.materialsSeen;
    var texturesSeen = state.texturesSeen;
    var imagesSeen = state.imagesSeen;

    var allMaterials = gltf.materials;
    var allTextures = gltf.textures;
    var allImages = gltf.images;

    // Generate some new IDs
    var newMaterialID = meshPrimitiveID + '_AO_material';
    var newTextureID = meshPrimitiveID + '_AO_texture';
    var newImageID = meshPrimitiveID + '_AO_image';

    // Grab the existing material
    var materialID = primitive.material;
    var material = allMaterials[materialID];
    var values = material.values;
    var diffuse = values.diffuse;

    // Check if the material has a diffuse texture material. if not,
    // - clone the example material
    // - clone the example texture
    // - clone the example image. resize to resolution and set to diffuse color, if any
    if (!defined(diffuse) || typeof diffuse !== 'string') {
        cloneAndSetupMaterialTextureImage({
            newMaterialID : newMaterialID,
            newTextureID : newTextureID,
            newImageID : newImageID,
            oldMaterialID : state.exampleMaterialID,
            oldTextureID : state.exampleTextureID,
            oldImageID : state.exampleImageID,
            materials : allMaterials,
            textures : allTextures,
            images : allImages
        });

        var color = defaultValue(diffuse, [1.0, 1.0, 1.0, 1.0]);
        // For jimp
        color[0] *= 255;
        color[1] *= 255;
        color[2] *= 255;
        color[3] *= 255;

        var newJimpImage = allImages[newImageID].extras._pipeline.jimpImage;

        var resolution = state.resolution;
        newJimpImage.resize(resolution, resolution);
        var hexColor = Jimp.rgbaToInt(color[0], color[1], color[2], color[3]);
        for (var x = 0; x < resolution; x++) {
            for (var y = 0; y < resolution; y++) {
                newJimpImage.setPixelColor(x, y, hexColor);
            }
        }
        primitive.material = newMaterialID;
        return allImages[newImageID];
    }

    var textureID = diffuse;
    var imageID = allTextures[textureID].source;

    if (materialsSeen.hasOwnProperty(materialID)) {
        // Check if the material is unique. If not, clone material, texture, and image
        cloneAndSetupMaterialTextureImage({
            newMaterialID : newMaterialID,
            newTextureID : newTextureID,
            newImageID : newImageID,
            oldMaterialID : materialID,
            oldTextureID : textureID,
            oldImageID : imageID,
            materials : allMaterials,
            textures : allTextures,
            images : allImages
        });
        primitive.material = newMaterialID;
    } else if(texturesSeen.hasOwnProperty(textureID)) {
        // Check if the texture is unique. If not clone the texture and the image.
        cloneAndSetupMaterialTextureImage({
            newTextureID : newTextureID,
            newImageID : newImageID,
            oldMaterialID : materialID,
            oldTextureID : textureID,
            oldImageID : imageID,
            materials : allMaterials,
            textures : allTextures,
            images : allImages
        });
        values.diffuse = newTextureID;
    } else if(imagesSeen.hasOwnProperty(imageID)) {
        // Check if the image is unique. if not, clone the image.
        var texture = allTextures[textureID];
        cloneAndSetupMaterialTextureImage({
            newImageID : newImageID,
            oldMaterialID : materialID,
            oldTextureID : textureID,
            oldImageID : imageID,
            materials : allMaterials,
            textures : allTextures,
            images : allImages
        });
        texture.source = newImageID;
    } else {
        // If nothing was cloned, mark this material, texture, and image as seen
        materialsSeen[materialID] = true;
        texturesSeen[textureID] = true;
        imagesSeen[imageID] = true;
        newImageID = imageID;
    }
    return allImages[newImageID];
}

////////// loading //////////

function generateRaytracerScene(gltf, options) {
    // Set up data we need for sampling. generate "triangle soup" over the whole scene.
    var accessors = gltf.accessors;
    var scene = gltf.scenes[options.sceneID];

    // read all accessors in one go to avoid repeated read-and-conversion
    var bufferDataByAccessor = {};

    for (var accessorID in accessors) {
        if (accessors.hasOwnProperty(accessorID)) {
            var accessor = accessors[accessorID];
            var accessorData = [];
            readAccessor(gltf, accessor, accessorData);
            bufferDataByAccessor[accessorID] = accessorData;
        }
    }

    var raytracerScene = {
        bufferDataByAccessor: bufferDataByAccessor,
        numberRays: options.numberRays,
        rayDistance: options.rayDistance,
        triangleGrid: {},
        aoBufferByPrimitive: {},
        nearCull: options.nearCull,
        toTexture: options.toTexture,
        sceneMin: new Cartesian3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
        sceneMax: new Cartesian3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)
    };

    // TODO: currently assuming each primitive appears in the scene once. figure out what to do when this is not true.

    // Generate all the world transform matrices
    NodeHelpers.computeFlatTransformScene(scene, gltf.nodes);

    var triangleSoup = [];
    var parameters = {
        resolution: options.resolution,
        raytracerScene: raytracerScene,
        triangleSoup: triangleSoup
    };

    // Process each primitive
    NodeHelpers.forEachPrimitiveInScene(gltf, scene, processPrimitive, parameters);

    // Additional Scene processing

    var min = raytracerScene.sceneMin;
    var max = raytracerScene.sceneMax;

    // Generate a rayDistance as needed. Default to 20% of the smallest AABB dimension.
    if (raytracerScene.rayDistance < 0.0) {
        var smallestDimension = Math.min(max.x - min.x, max.y - min.y, max.z - min.z);
        raytracerScene.rayDistance = smallestDimension * 0.20;
    }

    if (options.groundPlane) {
        // Generate a ground plane as two massive triangles if requested
        // - should be big enough that no rays can "overshoot" it
        // - should be a little lower than scene min + nearCull so rays cast from points at min can still hit it.
        var rayPadWidth = raytracerScene.rayDistance * 2.0;
        var planeHeight = min.y - 1.5 * raytracerScene.nearCull;
        var minmin = new Cartesian3(min.x - rayPadWidth, planeHeight, min.z - rayPadWidth);
        var maxmin = new Cartesian3(max.x + rayPadWidth, planeHeight, min.z - rayPadWidth);
        var maxmax = new Cartesian3(max.x + rayPadWidth, planeHeight, max.z + rayPadWidth);
        var minmax = new Cartesian3(min.x - rayPadWidth, planeHeight, max.z + rayPadWidth);

        triangleSoup.push([minmin, maxmin, maxmax]);
        triangleSoup.push([minmin, maxmax, minmax]);
    }

    // Build the uniform grid
    raytracerScene.triangleGrid = StaticUniformGrid.fromTriangleSoup(triangleSoup, raytracerScene.rayDistance);

    return raytracerScene;
}

function processPrimitive(primitive, meshPrimitiveID, parameters, node) {
    // AO only works with triangles, which is default if no mode specified
    if (defined(primitive.mode) && primitive.mode !== WebGLConstants.TRIANGLES) {
        return;
    }

    var raytracerScene = parameters.raytracerScene;
    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices];
    var positions = bufferDataByAccessor[primitive.attributes.POSITION];
    var numberTriangles = indices.length / 3;
    var transform = node.extras._pipeline.flatTransform;

    var resolution = parameters.resolution;

    if (raytracerScene.toTexture) {
        if (!defined(primitive.attributes.TEXCOORD_0)) {
            throw new DeveloperError("Could not find TEXCOORD_0. Generate texture coordinates or bake to vertices instead.");
        }
        raytracerScene.aoBufferByPrimitive[meshPrimitiveID] = {
            resolution: resolution,
            samples: new Array(resolution * resolution).fill(0.0),
            count: new Array(resolution * resolution).fill(CesiumMath.EPSILON10) // avoid div0 without branching
        };
    } else {
        var vertexCount = positions.length;
        raytracerScene.aoBufferByPrimitive[meshPrimitiveID] = {
            samples: new Array(vertexCount).fill(0.0),
            count: new Array(vertexCount).fill(CesiumMath.EPSILON10) // avoid div0 without branching
        };
    }

    // Read each triangle's Cartesian3s using the index buffer
    for (var i = 0; i < numberTriangles; i++) {
        var index0 = indices[i * 3];
        var index1 = indices[i * 3 + 1];
        var index2 = indices[i * 3 + 2];

        // Generate a world space triangle geometry for the soup
        var position0 = Matrix4.multiplyByPoint(transform, positions[index0], new Cartesian3());
        var position1 = Matrix4.multiplyByPoint(transform, positions[index1], new Cartesian3());
        var position2 = Matrix4.multiplyByPoint(transform, positions[index2], new Cartesian3());

        var triangle = [position0, position1, position2];
        parameters.triangleSoup.push(triangle);
        raytracerScene.sceneMin.x = Math.min(position0.x, position1.x, position2.x, raytracerScene.sceneMin.x);
        raytracerScene.sceneMin.y = Math.min(position0.y, position1.y, position2.y, raytracerScene.sceneMin.y);
        raytracerScene.sceneMin.z = Math.min(position0.z, position1.z, position2.z, raytracerScene.sceneMin.z);
        raytracerScene.sceneMax.x = Math.max(position0.x, position1.x, position2.x, raytracerScene.sceneMax.x);
        raytracerScene.sceneMax.y = Math.max(position0.y, position1.y, position2.y, raytracerScene.sceneMax.y);
        raytracerScene.sceneMax.z = Math.max(position0.z, position1.z, position2.z, raytracerScene.sceneMax.z);
    }
}

////////// Rendering //////////

function TrianglePixelMarchOptions() {
    this.uv0 = new Cartesian2();
    this.uv1 = new Cartesian2();
    this.uv2 = new Cartesian2();
    this.position0 = new Cartesian3();
    this.position1 = new Cartesian3();
    this.position2 = new Cartesian3();
    this.normal0 = new Cartesian3();
    this.normal1 = new Cartesian3();
    this.normal2 = new Cartesian3();
    this.transform = new Matrix4();
    this.inverseTranspose  = new Matrix4();
    this.raytracerScene = {};
    this.pixelWidth = 0.0;
    this.resolution = 0;
    this.pixelFunction = undefined;
    this.parameters = {};
}

// pixelFunction should expect arguments as parameters, contribution, count, pixelIndex
function trianglePixelMarch(options) {
    var uv0 = options.uv0;
    var uv1 = options.uv1;
    var uv2 = options.uv2;
    var position0 = options.position0;
    var position1 = options.position1;
    var position2 = options.position2;
    var normal0 = options.normal0;
    var normal1 = options.normal1;
    var normal2 = options.normal2;
    var transform = options.transform;
    var inverseTranspose = options.inverseTranspose;
    var raytracerScene = options.raytracerScene;
    var pixelWidth = options.pixelWidth;
    var resolution = options.resolution;

    var uMin = Math.min(uv0.x, uv1.x, uv2.x);
    var vMin = Math.min(uv0.y, uv1.y, uv2.y);
    var uMax = Math.max(uv0.x, uv1.x, uv2.x);
    var vMax = Math.max(uv0.y, uv1.y, uv2.y);

    // Perform a pixel march over the
    // 0.0, 0.0 to width, width is the bottom left pixel
    // 1.0-width, 1.0-width to 1.0, 1.0 is the top right pixel
    // Note: this is naive scanline rasterization, when conservative may be more appropriate, especially for textures.
    // See https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/125
    var halfWidth = pixelWidth / 2.0;
    uMin = Math.floor(uMin / pixelWidth) * pixelWidth + halfWidth;
    vMin = Math.floor(vMin / pixelWidth) * pixelWidth + halfWidth;
    uMax = Math.floor(uMax / pixelWidth) * pixelWidth + halfWidth;
    vMax = Math.floor(vMax / pixelWidth) * pixelWidth + halfWidth;

    var barycentric = barycentricCoordinateScratch;

    var numberRays = raytracerScene.numberRays;
    var sqrtNumberRays = Math.floor(Math.sqrt(numberRays));
    numberRays = sqrtNumberRays * sqrtNumberRays;

    computeAmbientOcclusionAtScratch.numberRays = numberRays;
    computeAmbientOcclusionAtScratch.sqrtNumberRays = sqrtNumberRays;
    computeAmbientOcclusionAtScratch.triangleGrid = raytracerScene.triangleGrid;
    computeAmbientOcclusionAtScratch.nearCull = raytracerScene.nearCull;
    computeAmbientOcclusionAtScratch.rayDistance = raytracerScene.rayDistance;

    var uStep = uMin;
    while(uStep < uMax) {
        var vStep = vMin;
        while(vStep < vMax) {
            // Use the triangle's uv coordinates to compute this texel's barycentric coordinates on the triangle
            cartesian2Scratch.x = uStep;
            cartesian2Scratch.y = vStep;
            barycentric = baryCentricCoordinates(cartesian2Scratch, uv0, uv1, uv2, barycentric);

            // Not in triangle
            if (barycentric.x < 0.0 || barycentric.y < 0.0 || barycentric.z < 0.0) {
                vStep += pixelWidth;
                continue;
            }

            // Use this barycentric coordinate to compute the local space position and normal on the triangle
            var position = worldPositionScratch;
            var normal = worldNormalScratch;
            GeometryMath.sumCartesian3sBarycentric(barycentric, position0, position1, position2, position);
            GeometryMath.sumCartesian3sBarycentric(barycentric, normal0, normal1, normal2, normal);

            // Transform to world space
            Matrix4.multiplyByPoint(transform, position, position);
            Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
            Cartesian3.normalize(normal, normal);

            // Raytrace
            computeAmbientOcclusionAtScratch.position = position;
            computeAmbientOcclusionAtScratch.normal = normal;

            var contribution = computeAmbientOcclusionAt(computeAmbientOcclusionAtScratch);

            options.pixelFunction(options.parameters, contribution, numberRays, Math.floor(uStep / pixelWidth) + Math.floor(vStep / pixelWidth) * resolution);
            vStep += pixelWidth;
        }
        uStep += pixelWidth;
    }
}

function texelPixelFunction(aoBuffer, contribution, numberRays, pixelIndex) {
    aoBuffer.count[pixelIndex] += numberRays;
    aoBuffer.samples[pixelIndex] += contribution;
}

function raytraceToTexels(primitive, meshPrimitiveID, parameters, node) {
    var raytracerScene = parameters.raytracerScene;
    var aoBuffer = raytracerScene.aoBufferByPrimitive[meshPrimitiveID];
    // If this primitive has no aoBuffer, skip. It's possible that this primitive is not triangles.
    if (!defined(aoBuffer)) {
        return;
    }

    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices];
    var positions = bufferDataByAccessor[primitive.attributes.POSITION];
    var normals = bufferDataByAccessor[primitive.attributes.NORMAL];
    var uvs = bufferDataByAccessor[primitive.attributes.TEXCOORD_0];
    var numTriangles = indices.length / 3;
    var transform = node.extras._pipeline.flatTransform;
    var inverseTranspose = matrix4Scratch;
    inverseTranspose = Matrix4.transpose(transform, inverseTranspose);
    inverseTranspose = Matrix4.inverse(inverseTranspose, inverseTranspose);

    var resolution = parameters.resolution;
    var pixelWidth = 1.0 / resolution;

    // For each position on a triangle corresponding to a texel center,
    // raytrace ambient occlusion.
    for (var i = 0; i < numTriangles; i++) {
        var i0 = indices[i * 3];
        var i1 = indices[i * 3 + 1];
        var i2 = indices[i * 3 + 2];

        trianglePixelMarchScratch.uv0 = uvs[i0];
        trianglePixelMarchScratch.uv1 = uvs[i1];
        trianglePixelMarchScratch.uv2 = uvs[i2];
        trianglePixelMarchScratch.position0 = positions[i0];
        trianglePixelMarchScratch.position1 = positions[i1];
        trianglePixelMarchScratch.position2 = positions[i2];
        trianglePixelMarchScratch.normal0 = normals[i0];
        trianglePixelMarchScratch.normal1 = normals[i1];
        trianglePixelMarchScratch.normal2 = normals[i2];
        trianglePixelMarchScratch.transform = transform;
        trianglePixelMarchScratch.inverseTranspose = inverseTranspose;
        trianglePixelMarchScratch.raytracerScene = raytracerScene;
        trianglePixelMarchScratch.pixelWidth = pixelWidth;
        trianglePixelMarchScratch.resolution = resolution;
        trianglePixelMarchScratch.pixelFunction = texelPixelFunction;
        trianglePixelMarchScratch.parameters = aoBuffer;

        trianglePixelMarch(trianglePixelMarchScratch);
    }
}

// Sample AO at each triangle center and add the resulting contribution to each vertex.
// Can be used on its own for high resolution meshes OR as a baseline for raytraceOverTriangleSamples
function raytraceAtTriangleCenters(primitive, meshPrimitiveID, parameters, node) {
    var raytracerScene = parameters.raytracerScene;
    var aoBuffer = raytracerScene.aoBufferByPrimitive[meshPrimitiveID];

    // If this primitive has no aoBuffer, skip. It's possible that this primitive is not triangles.
    if (!defined(aoBuffer)) {
        return;
    }

    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices];
    var positions = bufferDataByAccessor[primitive.attributes.POSITION];
    var normals = bufferDataByAccessor[primitive.attributes.NORMAL];
    var numTriangles = indices.length / 3;

    var transform = node.extras._pipeline.flatTransform;
    var inverseTranspose = matrix4Scratch;
    inverseTranspose = Matrix4.transpose(transform, inverseTranspose);
    inverseTranspose = Matrix4.inverse(inverseTranspose, inverseTranspose);

    var numberRays = raytracerScene.numberRays;
    var sqrtNumberRays = Math.floor(Math.sqrt(numberRays));

    computeAmbientOcclusionAtScratch.numberRays = numberRays;
    computeAmbientOcclusionAtScratch.sqrtNumberRays = sqrtNumberRays;
    computeAmbientOcclusionAtScratch.triangleGrid = raytracerScene.triangleGrid;
    computeAmbientOcclusionAtScratch.nearCull = raytracerScene.nearCull;
    computeAmbientOcclusionAtScratch.rayDistance = raytracerScene.rayDistance;

    // From each triangle center, raytrace ambient occlusion.
    for (var i = 0; i < numTriangles; i++) {
        var index0 = indices[i * 3];
        var index1 = indices[i * 3 + 1];
        var index2 = indices[i * 3 + 2];

        var position = worldPositionScratch;
        var normal = worldNormalScratch;
        var barycentric = barycentricCoordinateScratch;
        barycentric.x = 1/3;
        barycentric.y = 1/3;
        barycentric.z = 1/3;

        GeometryMath.sumCartesian3sBarycentric(barycentric, positions[index0], positions[index1], positions[index2], position);
        GeometryMath.sumCartesian3sBarycentric(barycentric, normals[index0], normals[index1], normals[index2], normal);

        // Transform to world space
        Matrix4.multiplyByPoint(transform, position, position);
        Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
        Cartesian3.normalize(normal, normal);

        computeAmbientOcclusionAtScratch.position = position;
        computeAmbientOcclusionAtScratch.normal = normal;

        // Raytrace
        var contribution = computeAmbientOcclusionAt(computeAmbientOcclusionAtScratch);

        aoBuffer.samples[index0] += contribution;
        aoBuffer.samples[index1] += contribution;
        aoBuffer.samples[index2] += contribution;
        aoBuffer.count[index0] += numberRays;
        aoBuffer.count[index1] += numberRays;
        aoBuffer.count[index2] += numberRays;
    }
}

var triangleUVs = [];
triangleUVs.push(new Cartesian2());
triangleUVs.push(new Cartesian2());
triangleUVs.push(new Cartesian2());

function raytraceOverTriangleSamples(primitive, meshPrimitiveID, parameters, node) {
    var raytracerScene = parameters.raytracerScene;
    var aoBuffer = raytracerScene.aoBufferByPrimitive[meshPrimitiveID];

    // If this primitive has no aoBuffer, skip. It's possible that this primitive is not triangles.
    if (!defined(aoBuffer)) {
        return;
    }

    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices];
    var positions = bufferDataByAccessor[primitive.attributes.POSITION];
    var normals = bufferDataByAccessor[primitive.attributes.NORMAL];
    var numTriangles = indices.length / 3;
    var transform = node.extras._pipeline.flatTransform;
    var inverseTranspose = matrix4Scratch;
    inverseTranspose = Matrix4.transpose(transform, inverseTranspose);
    inverseTranspose = Matrix4.inverse(inverseTranspose, inverseTranspose);

    var resolution = parameters.density;
    var pixelWidth = 1.0 / resolution;

    // From each position on a triangle corresponding to a texel center,
    // raytrace ambient occlusion.
    for (var i = 0; i < numTriangles; i++) {
        var i0 = indices[i * 3];
        var i1 = indices[i * 3 + 1];
        var i2 = indices[i * 3 + 2];

        var position0 = positions[i0];
        var position1 = positions[i1];
        var position2 = positions[i2];

        // compute UVs for the triangle
        GeometryMath.flattenTriangle([position0, position1, position2], triangleUVs);

        var pixelFunctionParameters = {
            aoBuffer: aoBuffer,
            i0: i0,
            i1: i1,
            i2: i2
        };

        trianglePixelMarchScratch.uv0 = triangleUVs[0];
        trianglePixelMarchScratch.uv1 = triangleUVs[1];
        trianglePixelMarchScratch.uv2 = triangleUVs[2];
        trianglePixelMarchScratch.position0 = positions[i0];
        trianglePixelMarchScratch.position1 = positions[i1];
        trianglePixelMarchScratch.position2 = positions[i2];
        trianglePixelMarchScratch.normal0 = normals[i0];
        trianglePixelMarchScratch.normal1 = normals[i1];
        trianglePixelMarchScratch.normal2 = normals[i2];
        trianglePixelMarchScratch.transform = transform;
        trianglePixelMarchScratch.inverseTranspose = inverseTranspose;
        trianglePixelMarchScratch.raytracerScene = raytracerScene;
        trianglePixelMarchScratch.pixelWidth = pixelWidth;
        trianglePixelMarchScratch.resolution = resolution;
        trianglePixelMarchScratch.pixelFunction = planeSamplePixelFunction;
        trianglePixelMarchScratch.parameters = pixelFunctionParameters;

        trianglePixelMarch(trianglePixelMarchScratch);
    }
}

function planeSamplePixelFunction(parameters, contribution, numberRays) {
    var aoBuffer = parameters.aoBuffer;
    var i0 = parameters.i0;
    var i1 = parameters.i1;
    var i2 = parameters.i2;

    // Update samples
    aoBuffer.samples[i0] += contribution;
    aoBuffer.samples[i1] += contribution;
    aoBuffer.samples[i2] += contribution;
    aoBuffer.count[i0] += numberRays;
    aoBuffer.count[i1] += numberRays;
    aoBuffer.count[i2] += numberRays;
}

function ComputeAmbientOcclusionAtOptions() {
    this.position = new Cartesian3();
    this.normal = new Cartesian3();
    this.numberRays = 0;
    this.sqrtNumberRays = 0;
    this.triangleGrid = undefined;
    this.nearCull = 0.0;
    this.rayDistance = 0.0;
}

function computeAmbientOcclusionAt(options) {
    var numberRays = options.numberRays;
    var contribution = 0.0;
    for (var j = 0; j < numberRays; j++) {
        var sampleRay = generateJitteredRay(options.position, options.normal, j, options.sqrtNumberRays);
        if(uniformGridRaytrace(options.triangleGrid, sampleRay, options.nearCull, options.rayDistance)) {
            contribution += 1.0;
        }
    }
    return contribution;
}

function raytraceNeighborFunction(positions, parameters) {
    var distance = IntersectionTests.rayTriangleParametric(parameters.ray, positions[0], positions[1], positions[2], false);
    parameters.hasIntersect = defined(distance) && (distance > parameters.nearCull) && (distance < parameters.farCull);
    return parameters.hasIntersect;
}

function GridFunctionParameters() {
    this.hasIntersect = false;
    this.nearCull = 0.0;
    this.farCull = 0.0;
    this.ray = new Ray();
}

var gridFunctionParametersScratch = new GridFunctionParameters();
function uniformGridRaytrace(uniformGrid, ray, nearCull, farCull) {
    var parameters = gridFunctionParametersScratch;
    parameters.hasIntersect = false;
    parameters.nearCull = nearCull;
    parameters.farCull = farCull;
    parameters.ray = ray;

    StaticUniformGrid.forNeighborsOctant(uniformGrid, ray.origin, ray.direction, raytraceNeighborFunction, parameters);

    return parameters.hasIntersect;
}

var axisScratch = new Cartesian3();
function generateJitteredRay(position, normal, sampleNumber, sqrtNumberRays) {
    // Stratified (jittered) Sampling with javascript's own rand function
    // Based on notes here: http://graphics.ucsd.edu/courses/cse168_s14/ucsd/CSE168_11_Random.pdf

    // Produces samples based on a grid of dimension sqrtNumberRays x sqrtNumberRays
    var cellWidth = 1.0 / sqrtNumberRays;
    var s = (sampleNumber % sqrtNumberRays) * cellWidth + (Math.random() / sqrtNumberRays);
    var t = Math.floor(sampleNumber / sqrtNumberRays) * cellWidth + (Math.random() / sqrtNumberRays);

    // Generate ray on a y-up hemisphere with cosine weighting (more rays around the normal)
    var u = 2.0 * Math.PI * s;
    var v = Math.sqrt(1.0 - t);

    var randomDirection = scratchRay.direction;
    randomDirection.x = v * Math.cos(u);
    randomDirection.y = t;
    randomDirection.z = v * Math.sin(u);

    // Orient with given normal
    var theta = Math.acos(normal.y); // dot product of normal with y-up is normal.y
    var axis = Cartesian3.cross(randomDirection, normal, axisScratch);
    var rotation = Quaternion.fromAxisAngle(axis, theta, quaternionScratch);
    var matrix = Matrix3.fromQuaternion(rotation, matrix3Scratch);

    scratchRay.origin = position;
    scratchRay.direction = Matrix3.multiplyByVector(matrix, randomDirection, scratchRay.direction);
    return scratchRay;
}
