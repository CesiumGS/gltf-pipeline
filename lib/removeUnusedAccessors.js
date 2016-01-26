'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removeUnusedAccessors;

function removeUnusedAccessors(gltf, stats) {
    var usedAccessorIds = {};
    var meshes = gltf.meshes;
    var skins = gltf.skins;
    var animations = gltf.animations;

    // Build hash of used accessors by iterating through meshes, skins, and animations
    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                var primitives = meshes[meshId].primitives;
                if (defined(primitives)) {
                    var length = primitives.length;
                    for (var i = 0; i < length; i++) {
                        var attributes = primitives[i].attributes;
                        if (defined(attributes)) {
                            for (var attributeId in attributes) {
                                if (attributes.hasOwnProperty(attributeId)) {
                                    var primitiveAccessorId = attributes[attributeId];
                                    usedAccessorIds[primitiveAccessorId] = true;
                                }
                            }
                        }
                        var indicesId = primitives[i].indices;
                        if (defined(indicesId)) {
                            usedAccessorIds[indicesId] = true;
                        }
                    }
                }
            }
        }
    }
    if (defined(skins)) {
        for (var skinId in skins) {
            if (skins.hasOwnProperty(skinId)) {
                var skinAccessorId = skins[skinId].inverseBindMatrices;
                usedAccessorIds[skinAccessorId] = true;
            }
        }
    }
    if (defined(animations)) {
        for (var animationId in animations) {
            if (animations.hasOwnProperty(animationId)) {
                var parameters = animations[animationId].parameters;
                if (defined(parameters)) {
                    for (var parameterId in parameters) {
                        if (parameters.hasOwnProperty(parameterId)) {
                            var animationAccessorId = parameters[parameterId];
                            usedAccessorIds[animationAccessorId] = true;
                        }
                    }
                }
            }
        }
    }

    // Iterate through accessors and remove those that are not in the hash
    var numberOfAccessorsRemoved = 0;
    var accessors = gltf.accessors;
    if (defined(accessors)) {
        var usedAccessors = {};

        for (var accessorId in accessors) {
            if (accessors.hasOwnProperty(accessorId)) {
                // If this accessor is in the hash, then keep it in the glTF asset
                if (defined(usedAccessorIds[accessorId])) {
                    usedAccessors[accessorId] = accessors[accessorId];
                } else {
                    ++numberOfAccessorsRemoved;
                }
            }
        }

        if (defined(stats)) {
            stats.numberOfAccessorsRemoved += numberOfAccessorsRemoved;
        }

        gltf.accessors = usedAccessors;
    }


    return gltf;
}