'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var loadGltfUris = require('./loadGltfUris');
module.exports = combinePrimitives;

//Combines primitives in a mesh which have the same material, mode, and attributes.
function combinePrimitives(gltf) {
    if (defined(gltf.accessors) && defined(gltf.bufferViews) && defined(gltf.buffers)) {
        loadGltfUris(gltf);
        var meshes = gltf.meshes;
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
    }

    return gltf;
}

//Combines the primitives for a given mesh.
function combineMeshPrimitives(gltf, meshId, primitives) {
    //Group the primitives which share the same material, mode, and attibutes.
    var primitiveGroups = [];
    var combinedPrimitives = [];
    while (primitives.length > 0) {
        var currentPrimitive = primitives.shift();
        var currentGroup = [currentPrimitive];
        for (var i = 0; i < primitives.length; i++) {
            var nextPrimitive = primitives[i];
            if (readyToCombine(currentPrimitive, nextPrimitive)) {
                currentGroup.push(nextPrimitive);
                primitives.splice(i, 1);
                i--;
            }
        }
        primitiveGroups.push(currentGroup);
    }

    for (var i = 0; i < primitiveGroups.length; i++) {
        combinedPrimitives.push(combinePrimitiveGroup(gltf, meshId, primitiveGroups[i]));
    }

    return combinedPrimitives;
}


//Checks if two primitives can be combined based on their attributes, materials, and modes.
function readyToCombine(a, b) {
    if (a.material !== b.material || a.mode !== b.mode || defined(a.indices) !== defined(b.indices)) {
        return false;
    }

    var aKeys = Object.keys(a.attributes);
    var bKeys = Object.keys(b.attributes);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    else {
        aKeys.sort();
        bKeys.sort();
        for (var i = 0; i < aKeys.length; i++) {
            if (aKeys[i] !== bKeys[i]) {
                return false;
            }
        }
    }

    return true;
}

//Creates a single primitive from a group of similar primitives.
function combinePrimitiveGroup(gltf, meshId, primitiveGroup) {
    var newAttributes = {};
    var referencePrimitive = primitiveGroup[0];
    var newPrimitive = {
        "material": referencePrimitive.material,
        "mode": referencePrimitive.mode
    };

    //For each attribute, combine all referenced accessors into a single accessor.
    if (defined(referencePrimitive.indices)) {
        newPrimitive.indices = mergeAccessors(gltf, meshId, undefined, primitiveGroup, referencePrimitive);
    }
    var attributeKeys = Object.keys(referencePrimitive.attributes);
    for (var i = 0; i < attributeKeys.length; i++) {
        var attributeKey = attributeKeys[i];
        newAttributes[attributeKey] = mergeAccessors(gltf, meshId, attributeKey, primitiveGroup, referencePrimitive);
    }
    newPrimitive.attributes = newAttributes;

    return newPrimitive;
}

//Create a new accessor, bufferView, and buffer based on those referenced by the primitive group.
//If the attributeType is undefined, we are merging an index accessor.
function mergeAccessors(gltf, meshId, attributeType, primitiveGroup, referencePrimitive) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var source = new Buffer(0);
    var target, byteStride;
    var referenceAccessor = defined(attributeType) ? accessors[referencePrimitive.attributes[attributeType]] : accessors[referencePrimitive.indices];
    var byteStride = defaultValue(referenceAccessor.byteStride, 0);
    var componentType = referenceAccessor.componentType;
    var type = referenceAccessor.type;
    var count = 0;
    var max, min;
    var maxIndex = -1;

    var attributeKey = defaultValue(attributeType, 'INDEX');
    var newBuffer = {
        "type": "arraybuffer",
        "uri": "data:,",
        "extras": {
            "_pipeline": {
                "extension": '.bin',
                "deleteExtras": true
            }
        }
    };
    var newBufferView = {
        "buffer": createNewId(gltf, meshId, attributeKey, 'buffer'),
        "byteOffset": 0,
        "extras": {
            "_pipeline": {
                "deleteExtras": true
            }
        }
    };
    var newAccessor = {
        "bufferView": createNewId(gltf, meshId, attributeKey, 'bufferView'),
        "byteOffset": 0,
        "byteStride": defaultValue(referenceAccessor.byteStride, 0),
        "componentType": referenceAccessor.componentType,
        "type": referenceAccessor.type,
        "extras": {
            "_pipeline": {
                "deleteExtras": true
            }
        }
    };

    //Generate combined source for all grouped primitives.
    for (var i = 0; i < primitiveGroup.length; i++) {
        var primitive = primitiveGroup[i];
        var accessor = defined(attributeType) ? accessors[primitive.attributes[attributeType]] : accessors[primitive.indices];

        //If the current accessor has a different type or componentType, throw an error.
        if (accessor.componentType !== componentType || accessor.type !== type) {
            throw new DeveloperError('Attributes cannot reference accessors with different types or componentTypes.');
        }

        //Update the properties for the new accessor.
        count += accessor.count;
        if (defined(accessor.max)) {
            if (defined(max)) {
                for (var i = 0; i < max.length; i++) {
                    if (accessor.max[i] > max[i]) {
                        max[i] = accessor.max[i];
                    }
                }
            }
            else {
                max = accessor.max;
            }
        }
        if (defined(accessor.min)) {
            if (defined(min)) {
                for (var i = 0; i < min.length; i++) {
                    if (accessor.min[i] < min[i]) {
                        min[i] = accessor.min[i];
                    }
                }
            }
            else {
                min = accessor.min;
            }
        }

        //Obtain the source from the accessor's bufferview and append to the new source.
        var bufferView = bufferViews[accessor.bufferView];
        var viewByteOffset = bufferView.byteOffset;
        var viewByteLength = defaultValue(bufferView.byteLength, 0);
        var bufferSource = buffers[bufferView.buffer].extras._pipeline.source;
        var bufferViewSource = bufferSource.slice(viewByteOffset, viewByteOffset + viewByteLength);

        //Calculate the length of the accessor source using the count and byteStride or componentType.
        var accessorByteLength = accessor.count;
        if (accessor.byteStride > 0) {
            accessorByteLength *= accessor.byteStride;
        }
        else {
            //Int16
            if (accessor.componentType === 5122 || accessor.componentType === 5123) {
                accessorByteLength *= 2;
            }
            //Float32
            if (accessor.componentType === 5126) {
                accessorByteLength *= 4;
            }
        }
        var accessorSource = bufferViewSource.slice(accessor.byteOffset, accessor.byteOffset + accessorByteLength);
        
        //If we are creating an index accessor, offset the indices based on the current primitive.
        if (!defined(attributeType)) {
            var prevMaxIndex = maxIndex + 1;
            for (var j = 0; j < accessorSource.length; j += 2) {
                var index = accessorSource.readUInt16LE(j) + prevMaxIndex;
                accessorSource.writeUInt16LE(index, j);

                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        }

        source = Buffer.concat([source, accessorSource]);

        //If it exists, add the target to the new bufferView object.
        if (!defined(newBufferView.target) && defined(bufferView.target)) {
            newBufferView.target = bufferView.target;
            target = bufferView.target;
        }
    }

    //Assign the properties calculated among all primitives and add the new objects to the glTF object.
    newAccessor.count = count;
    if (defined(max)) {
        newAccessor.max = max;
    }
    if (defined(min)) {
        newAccessor.min = min;
    }
    newBufferView.byteLength = source.length;
    newBuffer.byteLength = source.length;
    newBuffer.extras._pipeline.source = source;

    var accessorName = createNewId(gltf, meshId, attributeKey, 'accessor');
    accessors[accessorName] = newAccessor;
    bufferViews[newAccessor.bufferView] = newBufferView;
    buffers[newBufferView.buffer] = newBuffer;

    return accessorName;
}

//Creates a new object id based on the attribute type and existing objects.
function createNewId(gltf, meshId, attributeType, objectType) {
    var idCount = 0;
    var newId = meshId + '_' + attributeType + '_' + objectType + '_' + idCount;
    var objectKeys = Object.keys(gltf[objectType + 's']);
    while (objectKeys.indexOf(newId) != -1) {
        idCount++;
        newId = newId.slice(0, -1) + idCount;
    }

    return newId;
}