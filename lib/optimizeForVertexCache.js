'use strict';
var Cesium = require('cesium');
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var createAccessorUsageTables = require('./createAccessorUsageTables');

var GeometryPipeline = Cesium.GeometryPipeline;
var defined = Cesium.defined;

module.exports = optimizeForVertexCache;

// Helper method to map accessor collections from the usageTable to an independent primitive (if there is one)
function createIndicesToAttributeDictionary(gltf) {
    var dictionary = {};
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var indicesId = primitive.indices;

                var primitivesOfIndicesId;
                if (!dictionary[indicesId]) {
                    primitivesOfIndicesId = [];
                } else {
                    primitivesOfIndicesId = dictionary[indicesId];
                }
                primitivesOfIndicesId.push(primitive);

                dictionary[indicesId] = primitivesOfIndicesId;
            }
        }
    }
    return dictionary;
}

function getIndependentPrimitive(dictionary, indicesId, attributeAccessors) {
    var primitivesOfIndicesId = dictionary[indicesId];
    for (var primitiveId in primitivesOfIndicesId) {
        if (primitivesOfIndicesId.hasOwnProperty(primitiveId)) {
            var primitive = primitivesOfIndicesId[primitiveId];
            var attributes = primitive.attributes;

            var equalCount = 0;
            // Naive check to see if this primitive's attributes match
            for (var semantic in attributes) {
                if (attributes.hasOwnProperty(semantic)) {
                    var accessorId = attributes[semantic];
                    if (defined(attributeAccessors[accessorId])) {
                        equalCount++;
                    }
                }
            }
            var accessorsLength = Object.keys(attributeAccessors).length;
            // Ensure that this is an independent set of accessors
            if (equalCount === accessorsLength) {
                return primitive;
            }
        }
    }
}

/**
 * Uses Cesium's geometry optimizations to reorder attributes so that they are accessed
 * optimally by WebGL.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Number} [cacheSize=24] The cacheSize to use for Cesium.GeometryPipeline.reorderForPostVertexCache.
 * @returns {Object} The glTF asset with its indexed primitive attributes optimized for cache access.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function optimizeForVertexCache(gltf, cacheSize) {
    // perform post vertex cache optimization
    var primitive;
    var geometry;
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                primitive = primitives[i];
                if (defined(primitive.indices)) {
                    geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                    GeometryPipeline.reorderForPostVertexCache(geometry, cacheSize);
                    cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
                }
            }
        }
    }
    // perform pre vertex cache optimization on each independent primitive
    var usageTables = createAccessorUsageTables(gltf);
    var dictionary = createIndicesToAttributeDictionary(gltf);
    // Iterate through each usage table
    for (var j = 0; j < usageTables.length; j++) {
        var indexAccessors = usageTables[j].indexAccessors;
        var attributeAccessors = usageTables[j].attributeAccessors;
        var keys = Object.keys(indexAccessors);
        // If a set of attributes accessors is only used by one indices accessor
        if (keys.length === 1) {
            var indicesId = keys[0];
            // look through to see if an independent primitive exists for those attributes
            primitive = getIndependentPrimitive(dictionary, indicesId, attributeAccessors);
            // If there is, it can be safely pre vertex cache optimized
            if (defined(primitive)) {
                geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                GeometryPipeline.reorderForPreVertexCache(geometry);
                cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
        }
    }
    return gltf;
}
