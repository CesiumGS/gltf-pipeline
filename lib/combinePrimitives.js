'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
module.exports = combinePrimitives;

function combinePrimitives(gltf) {
    var accessors = gltf.accessors;
    var meshes = gltf.meshes;

    if (defined(accessors)) {
        for (var accessorId in accessors) {
            if (accessors.hasOwnProperty(accessorId)) {
                var accessor = accessors[accessorId];
                accessor.extras._pipeline.id = accessorId; //No longer have access to id with just the object
                accessor.extras._pipeline.isOriginal = true;
            }
        }
    }

    if (defined(meshes)) {
        for (var meshId in meshes) {
            if (meshes.hasOwnProperty(meshId)) {
                var mesh = meshes[meshId];
                var primitives = mesh.primitives;
                if (defined(primitives)) {
                    mesh.primitives = combineMeshPrimitives(gltf, meshId, primitives);
                }
            }
        }
    }

    return gltf;
}

//Combines the primitives for a given mesh.
function combineMeshPrimitives(gltf, meshId, primitives) {
    var accessors = gltf.accessors;
    //Group the primitives which share the same material, mode, and attibutes.
    var primitiveGroups = [];
    var newPrimitives = [];
    while (primitives.length > 0) {
        var currentPrimitive = primitives.shift();
        var currentGroup = [currentPrimitive];
        for (var i = 0; i < primitives.length; i++) {
            var nextPrimitive = primitives[i];
            if (readyToCombine(gltf, currentPrimitive, nextPrimitive)) {
                currentGroup.push(nextPrimitive);
                primitives.splice(i, 1);
                i--;
            }
        }
        primitiveGroups.push(currentGroup);
    }

    console.log(primitiveGroups);

    for (var i = 0; i < primitiveGroups.length; i++) {
        newPrimitives.push(combinePrimitiveGroup(gltf, accessors, meshId, primitiveGroups[i]));
    }

    return newPrimitives;
}


//Checks if primitives a and b can be combined based on their accessors, bufferViews, and buffers.
function readyToCombine(gltf, a, b) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var accessorPairs = {};

    if (defined(accessors) && defined(bufferViews) && defined(buffers)) {
        if (a.material === b.material && a.mode === b.mode
            && Object.keys(a.attributes).sort() === Object.keys(b.attributes).sort()) {
            if (defined(a.indices)) {
                if (defined(b.indices)) {
                    accessorPairs[a.indices] = b.indices;
                }
                else {
                    return false;
                }
            }

            var attributeKeys = Object.keys(a.attributes);
            for (var i = 0; i < attributeKeys.length; i++) {
                var attributeKey = attributeKeys[i];
                accessorPairs[a.attributes[attributeKey]] = b.attributes[attributeKey];
            }

            for (var accessorId in accessorPairs) {
                if (accessorPairs.hasOwnProperty(accessorId)) {
                    var accessorA = accessors[accessorId];
                    var accessorB = accessors[accessorPairs[accessorId]];
                    if (accessorA.componentType !== accessorB.componentType
                        || accessorA.type !== accessorB.type) {
                        return false;
                    }

                    var bufferViewA = accessorA.bufferView;
                    var bufferViewB = accessorB.bufferView;
                    if ((defined(bufferViewA.target) && defined(bufferViewB.target))
                        && (bufferViewA.target !== bufferViewB.target)) {
                        return false;
                    }

                    var bufferA = bufferViewA.buffer;
                    var bufferB = bufferViewB.buffer;
                    if ((defined(bufferA.type) && defined(bufferB.type))
                        && (bufferA.type !== bufferB.type)) {
                        return false;
                    }
                }
            }
        }
    }
    else {
        return false;
    }
    

    return true;
}

//Combines two primitives.
function combinePrimitivePair(gltf, meshId, a, b) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var newPrimitive = {
        "material" : a.material
    };

    if (defined(a.mode)) {
        newPrimitive.mode = a.mode;
    }


    if (defined(a.indices)) {
        newPrimitive.indices = mergeAccessors(accessors, "INDEX", meshId, accessors[a.indices], accessors[b.indices]);
    }

    newPrimitive.attributes = {};
    var attributeKeys = Object.keys(a.attributes);
    for (var i = 0; i < attributeKeys.length; i++) {
        var attributeKey = attributeKeys[i];
        newPrimitive.attributes[attributeKey] = mergeAccessors(accessors, attributeKey, meshId, accessors[a.attributes[attributeKey]], accessors[b.attributes[attributeKey]]);
    }
    
    return newPrimitive;
}

function combinePrimitiveGroup(gltf, accessors, meshId, primitiveGroup) {
    var newPrimitive = {};
    var newAccessors = {};

    //Set up attribute/index accessors
    var primitive = primitiveGroup[0];
    if (defined(primitive.indices)) {
        var count = 0;
        var newId = meshId + '_' + "INDEX" + '_accessor_' + count;
        while (Object.keys(accessors).indexOf(newId) != -1) {
            count++;
            newId = newId.slice(0, -1) + count;
        }

        newPrimitive.indices = mergeAccessors(undefined, primitiveGroup); //merge primitives based on attribute
    }

    //for each accessor, combine all the accessors in each primitive
    var attributeKeys = Object.keys(primitive.attributes);
    for (var i = 0; i < attributeKeys; i++) {
        var attributeKey = attributeKeys[i];
        var count = 0;
        var newId = meshId + '_' + attributeKey + '_accessor_' + count;
        while (Object.keys(accessors).indexOf(newId) != -1) {
            count++;
            newId = newId.slice(0, -1) + count;
        }
        newAccessors[newId] = mergeAccessors(attributeKey, primitiveGroup);
    }
}

function mergeAccessors(attributeKey, primitiveGroup) {
    for (var i = 0; i < primitiveGroup.length; i++) {
        var primitive = primitiveGroup[i];
        var source;
        var accessor;
        if (defined(attributeKey)) {
            accessor = primitive.attributes[attributeKey];
        }
        else {
            accessor = primitive.indices;
        }

        //Get source from accessor's bufferview, append to new source
        //Create buffer, bufferview from new buffer
        //Create new accessor from new bufferview
        //Set indices/attribute to new accessor id
    }
    
}