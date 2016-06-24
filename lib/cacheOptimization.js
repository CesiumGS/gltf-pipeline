'use strict';
var gltfPrimitiveToCesiumGeometry = require('./gltfPrimitiveToCesiumGeometry');
var cesiumGeometryToGltfPrimitive = require('./cesiumGeometryToGltfPrimitive');
var createAccessorUsageTables = require('./createAccessorUsageTables');
var Cesium = require('cesium');
var GeometryPipeline = Cesium.GeometryPipeline;
var defined = Cesium.defined;

module.exports = cacheOptimization;

// Helper method to map accessor collections from the usageTable to an independent primitive (if there is one)
function getAccessorsPrimitive(gltf, attributeAccessors, indicesAccessor) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var accessors = primitive.attributes;

                var equalCount = 0;
                // Naive check to see if this primitive's attributes match
                for (var accessorId in accessors) {
                    if (accessors.hasOwnProperty(accessorId)) {
                        for (var attributeAccessor in attributeAccessors) {
                            if (attributeAccessor === accessors[accessorId]) {
                                equalCount++;
                            }
                        }
                    }
                }
                var primitiveIndices = primitive.indices;
                var accessorsLength = Object.keys(attributeAccessors).length;
                // Ensure that this is an independent set of accessors
                if (equalCount === accessorsLength && indicesAccessor === primitiveIndices) {
                    return primitive;
                }
            }
        }
    }
}

function cacheOptimization(gltf, cacheSize) {
    // perform post vertex cache optimization
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                GeometryPipeline.reorderForPostVertexCache(geometry, cacheSize);

                cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
        }
    }
    // perform pre vertex cache optimization on each independent primitive
    var usageTables = createAccessorUsageTables(gltf);
    // Iterate through each usage table
    for (var j = 0; j < usageTables.length; j++) {
        var indexAccessors = usageTables[j].indexAccessors;
        var attributeAccessors = usageTables[j].attributeAccessors;
        var keys = Object.keys(indexAccessors);
        // If a set of attributes accessors is only used by one indices accessor
        if (keys.length === 1) {
            var indicesId = keys[0];
            // look through to see if an independent primitive exists for those attributes
            var primitive = getAccessorsPrimitive(gltf, attributeAccessors, indicesId);

            // console.log(primitive);
            
            
            
            
            // If there is, it can be safely pre vertex cache optimized
            if (defined(primitive)) {
                var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
                GeometryPipeline.reorderForPreVertexCache(geometry);
                cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
            }
        }
    }
}
