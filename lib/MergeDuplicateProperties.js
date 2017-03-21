'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var deepEqual = require('deep-equal');
var byteLengthForComponentType = require('./byteLengthForComponentType');
var ForEach = require('./ForEach');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var RemoveUnusedProperties = require('./RemoveUnusedProperties');

var defined = Cesium.defined;

module.exports = MergeDuplicateProperties;

/**
 * Contains stages to merge duplicate glTF elements.
 * A duplicate element is one that could be substituted by another existing element with no behavior change.
 * Duplicate references are only re-assigned, the redundant elements are not deleted.
 *
 * @constructor
 */
function MergeDuplicateProperties() {}

/**
 * Merges all duplicate elements in the glTF asset in top-down order so merged references resolve down the hierarchy.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with merged duplicate elements.
 */
MergeDuplicateProperties.mergeAll = function(gltf) {
    MergeDuplicateProperties.mergeAccessors(gltf);
    MergeDuplicateProperties.mergeShaders(gltf);
    MergeDuplicateProperties.mergePrograms(gltf);
    MergeDuplicateProperties.mergeTechniques(gltf);
    MergeDuplicateProperties.mergeMaterials(gltf);
};

/**
 * Looks for accessors in a glTf hierarchy that contain the same data, removes all of the copies
 * and changes references to point to a single copy.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with merged duplicate accessors.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
MergeDuplicateProperties.mergeAccessors = function(gltf) {
    var duplicateMapping = createDuplicateMapping(gltf);
    // Use the duplicate mapping to merge the accessors
    for (var accessorId in duplicateMapping) {
        if (duplicateMapping.hasOwnProperty(accessorId)) {
            accessorId = parseInt(accessorId);
            var duplicates = duplicateMapping[accessorId];
            for (var i = 0; i < duplicates.length; i++) {
                var duplicateId = duplicates[i];
                var metaDuplicates = duplicateMapping[duplicateId];
                if (defined(metaDuplicates)) {
                    duplicates.concat(metaDuplicates);
                }
                replaceAccessorIdInstances(gltf, duplicateId, accessorId);
            }
        }
    }
    RemoveUnusedProperties.removeAccessors(gltf);
    return gltf;
};

function replaceAccessorIdInstances(gltf, accessorId, newAccessorId) {
    ForEach.mesh(gltf, function(mesh) {
        ForEach.meshPrimitives(mesh, function (primitive) {
            var indices = primitive.indices;
            if (indices === accessorId) {
                primitive.indices = newAccessorId;
            }
            ForEach.meshPrimitiveAttributes(primitive, function (attributeAccessorId, semantic) {
                if (attributeAccessorId === accessorId) {
                    primitive.attributes[semantic] = newAccessorId;
                }
            });
        });
    });
}

function createDuplicateMapping(gltf) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var duplicateMapping = {};
    for (var i = 0; i < accessors.length; i++) {
        var iAccessor = accessors[i];
        for (var j = i+1; j < accessors.length; j++) {
            var jAccessor = accessors[j];
            if (accessorPropertiesMatch(iAccessor, jAccessor)) {
                var iBufferViewId = iAccessor.bufferView;
                var iBufferView = bufferViews[iBufferViewId];
                var iBufferId = iBufferView.buffer;
                var iBuffer = buffers[iBufferId];
                var iBufferSource = iBuffer.extras._pipeline.source;
                var iByteOffset = iAccessor.byteOffset + iBufferView.byteOffset;
                var iByteStride = getAccessorByteStride(gltf, iAccessor);
                var count = iAccessor.count;
                var elementByteLength = byteLengthForComponentType(iAccessor.componentType) * numberOfComponentsForType(iAccessor.type);

                var jBufferViewId = jAccessor.bufferView;
                var jBufferView = bufferViews[jBufferViewId];
                var jBufferId = jBufferView.buffer;
                var jBuffer = buffers[jBufferId];
                var jBufferSource = jBuffer.extras._pipeline.source;
                var jByteOffset = jAccessor.byteOffset + jBufferView.byteOffset;
                var jByteStride = getAccessorByteStride(gltf, jAccessor);

                var accessorsMatch = true;
                for (var k = 0; k < count; k++) {
                    for (var byteOffset = 0; byteOffset < elementByteLength; byteOffset++) {
                        if (iBufferSource[iByteOffset + byteOffset] !== jBufferSource[jByteOffset + byteOffset]) {
                            accessorsMatch = false;
                            break;
                        }
                    }
                    if (!accessorsMatch) {
                        break;
                    }
                    iByteOffset += iByteStride;
                    jByteOffset += jByteStride;
                }
                if (accessorsMatch) {
                    var mapping = duplicateMapping[i];
                    if (!defined(mapping)) {
                        mapping = [];
                        duplicateMapping[i] = mapping;
                    }
                    mapping.push(j);
                }
            }
        }
    }
    return duplicateMapping;
}

function accessorPropertiesMatch(accessor1, accessor2) {
    return accessor1.componentType === accessor2.componentType &&
        accessor1.count === accessor2.count &&
        accessor1.type === accessor2.type;
}

/**
 * Merges all duplicate shaders in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF with merged duplicate shaders.
 */
MergeDuplicateProperties.mergeShaders = function(gltf) {
    var shaders = gltf.shaders;
    var shaderIds = Object.keys(shaders);
    var shaderIdsLength = shaderIds.length;
    var shaderIdMapping = {};
    var uniqueShadersByType = {};
    for (var i = 0; i < shaderIdsLength; i++) {
        var shaderId = parseInt(shaderIds[i]);
        var shader = shaders[shaderId];
        var type = shader.type;
        var uniqueShaders = uniqueShadersByType[type];
        if (!defined(uniqueShaders)) {
            uniqueShaders = [];
            uniqueShadersByType[type] = uniqueShaders;
        }
        var uniqueShadersLength = uniqueShaders.length;
        var unique = true;
        for (var j = 0; j < uniqueShadersLength; j++) {
            var uniqueShaderId = uniqueShaders[j];
            var uniqueShader = shaders[uniqueShaderId];
            if (shaderEquals(shader, uniqueShader)) {
                shaderIdMapping[shaderId] = uniqueShaderId;
                unique = false;
                break;
            }
        }
        if (unique) {
            uniqueShaders.push(shaderId);
        }
    }
    remapShaders(gltf, shaderIdMapping);
    return gltf;
};

function remapShaders(gltf, shaderIdMapping) {
    ForEach.program(gltf, function(program) {
        var fragmentShaderId = program.fragmentShader;
        var vertexShaderId = program.vertexShader;
        var mappedFragmentShaderId = shaderIdMapping[fragmentShaderId];
        var mappedVertexShaderId = shaderIdMapping[vertexShaderId];
        if (defined(mappedFragmentShaderId)) {
            program.fragmentShader = mappedFragmentShaderId;
        }
        if (defined(mappedVertexShaderId)) {
            program.vertexShader = mappedVertexShaderId;
        }
    });
}

function shaderEquals(shaderOne, shaderTwo) {
    if (shaderOne.type !== shaderTwo.type) {
        return false;
    }
    return bufferEqual(shaderOne.extras._pipeline.source, shaderTwo.extras._pipeline.source);
}

/**
 * Merges all duplicate programs in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF with merged duplicate programs.
 */
MergeDuplicateProperties.mergePrograms = function(gltf) {
    var programs = gltf.programs;
    var programIdMapping = {};
    var uniqueProgramIds = [];
    var uniquePrograms = {};
    ForEach.program(gltf, function(program, programId) {
        program = clone(program);
        delete program.name;
        delete program.extras;
        var uniqueProgramIdsLength = uniqueProgramIds.length;
        var unique = true;
        for (var i = 0; i < uniqueProgramIdsLength; i++) {
            var uniqueProgramId = uniqueProgramIds[i];
            var uniqueProgram = programs[uniqueProgramId];
            if (deepEqual(program, uniqueProgram)) {
                programIdMapping[programId] = uniqueProgramId;
                unique = false;
                break;
            }
        }
        if (unique) {
            uniqueProgramIds.push(programId);
            uniquePrograms[programId] = program;
        }
    });
    remapPrograms(gltf, programIdMapping);
};

function remapPrograms(gltf, programIdMapping) {
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var programId = technique.program;
            var mappedProgramId = programIdMapping[programId];
            if (defined(mappedProgramId)) {
                technique.program = mappedProgramId;
            }
        }
    }
}

/**
 * Merges all duplicate techniques in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF with merged duplicate techniques.
 */
MergeDuplicateProperties.mergeTechniques = function(gltf) {
    var techniques = gltf.techniques;
    var techniqueIdMapping = {};
    var uniqueTechniqueIds = [];
    var uniqueTechniques = {};
    ForEach.technique(gltf, function(technique, techniqueId) {
        technique = clone(technique);
        delete technique.name;
        delete technique.extras;
        var uniqueTechniqueIdsLength = uniqueTechniqueIds.length;
        var unique = true;
        for (var i = 0; i < uniqueTechniqueIdsLength; i++) {
            var uniqueTechniqueId = uniqueTechniqueIds[i];
            var uniqueTechnique = techniques[uniqueTechniqueId];
            if (deepEqual(technique, uniqueTechnique)) {
                techniqueIdMapping[techniqueId] = uniqueTechniqueId;
                unique = false;
                break;
            }
        }
        if (unique) {
            uniqueTechniqueIds.push(techniqueId);
            uniqueTechniques[techniqueId] = technique;
        }
    });
    remapTechniques(gltf,techniqueIdMapping);
};

function remapTechniques(gltf, techniqueIdMapping) {
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            var techniqueId = material.technique;
            var mappedTechniqueId = techniqueIdMapping[techniqueId];
            if (defined(mappedTechniqueId)) {
                material.technique = mappedTechniqueId;
            }
        }
    }
}

/**
 * Merges all duplicate materials in the glTF asset.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF with merged duplicate materials.
 */
MergeDuplicateProperties.mergeMaterials = function(gltf) {
    var materialIdMapping = {};
    var uniqueMaterialIds = [];
    var uniqueMaterials = {};
    ForEach.material(gltf, function(material, materialId) {
        material = clone(material);
        delete material.name;
        delete material.extras;
        var uniqueMaterialIdsLength = uniqueMaterialIds.length;
        var unique = true;
        for (var i = 0; i < uniqueMaterialIdsLength; i++) {
            var uniqueMaterialId = uniqueMaterialIds[i];
            var uniqueMaterial = uniqueMaterials[uniqueMaterialId];
            if (deepEqual(material, uniqueMaterial)) {
                materialIdMapping[materialId] = uniqueMaterialId;
                unique = false;
                break;
            }
        }
        if (unique) {
            uniqueMaterialIds.push(materialId);
            uniqueMaterials[materialId] = material;
        }
    });
    remapMaterials(gltf, materialIdMapping);
};

function remapMaterials(gltf, materialIdMapping) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var materialId = primitive.material;
                var mappedMaterialId = materialIdMapping[materialId];
                if (defined(mappedMaterialId)) {
                    primitive.material = mappedMaterialId;
                }
            }
        }
    }
}