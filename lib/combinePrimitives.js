'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;

var byteLengthForComponentType = require('./byteLengthForComponentType');
var getAccessorByteStride = require('./getAccessorByteStride');
var numberOfComponentsForType = require('./numberOfComponentsForType');
var readBufferComponent = require('./readBufferComponent');
var writeBufferComponent = require('./writeBufferComponent');

module.exports = combinePrimitives;

//Combines primitives in a mesh which have the same material, mode, and attributes.
function combinePrimitives(gltf) {
    if (defined(gltf.accessors) && defined(gltf.bufferViews) && defined(gltf.buffers)) {
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

    for (var j = 0; j < primitiveGroups.length; j++) {
        combinedPrimitives.push(combinePrimitiveGroup(gltf, meshId, primitiveGroups[j]));
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

    aKeys.sort();
    bKeys.sort();
    for (var i = 0; i < aKeys.length; i++) {
        if (aKeys[i] !== bKeys[i]) {
            return false;
        }
    }

    return true;
}

//Creates a single primitive from a group of similar primitives.
function combinePrimitiveGroup(gltf, meshId, primitiveGroup) {
    var referencePrimitive = primitiveGroup[0];
    if (primitiveGroup.length > 1) {
        var newAttributes = {};
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
    return referencePrimitive;
}

//Create a new accessor, bufferView, and buffer based on those referenced by the primitive group.
//If the attributeType is undefined, we are merging an index accessor.
function mergeAccessors(gltf, meshId, attributeType, primitiveGroup, referencePrimitive) {
    var accessors = gltf.accessors;
    var bufferViews = gltf.bufferViews;
    var buffers = gltf.buffers;
    var source = new Buffer(0);
    var referenceAccessor = defined(attributeType) ? accessors[referencePrimitive.attributes[attributeType]] : accessors[referencePrimitive.indices];
    var componentType = referenceAccessor.componentType;
    var type = referenceAccessor.type;
    var count = 0;
    var target;
    var min, max;
    var maxIndex = -1;
    var attributeKey = defaultValue(attributeType, 'INDEX');
    var newBuffer = {
        "type": "arraybuffer",
        "uri": "data:,",
        "extras": {
            "_pipeline": {
                "extension": ".bin",
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
        var accessorId = defined(attributeType) ? primitive.attributes[attributeType] : primitive.indices;
        var accessor = accessors[accessorId];
        var bufferViewId = accessor.bufferView;
        var bufferView = bufferViews[bufferViewId];
        var numberOfComponents = numberOfComponentsForType(accessor.type);
        if (!defined(min)) {
            min = defaultValue(accessor.min, new Array(numberOfComponents).fill(Number.MAX_VALUE));
        }
        if (!defined(max)) {
            max = defaultValue(accessor.max, new Array(numberOfComponents).fill(-Number.MAX_VALUE));
        }

        //If the current accessor has a different type or componentType, throw an error.
        if (accessor.componentType !== componentType || accessor.type !== type) {
            throw new DeveloperError('Attributes cannot reference accessors with different types or componentTypes.');
        }
        checkCombineWarning(accessor, 'accessor', accessorId);

        var buffer = buffers[bufferView.buffer];
        checkCombineWarning(buffer, 'buffer', bufferView.buffer);
        var bufferSource = buffer.extras._pipeline.source;

        //Copy the accessor data into a new buffer
        var accessorCount = accessor.count;
        var componentByteLength = byteLengthForComponentType(accessor.componentType);
        var elementByteLength = componentByteLength * numberOfComponents;
        var accessorLength = elementByteLength * accessorCount;
        var accessorByteStride = getAccessorByteStride(accessor);
        var byteOffset = accessor.byteOffset + bufferView.byteOffset;
        var accessorSource = new Buffer(accessorLength);

        var indexOffset = maxIndex + 1;
        var accessorSourceOffset = 0;
        for (var j = 0; j < accessorCount; j++) {
            for (var k = 0; k < numberOfComponents; k++) {
                var value = readBufferComponent(bufferSource, accessor.componentType, byteOffset + k * componentByteLength);
                //If we are creating an index accessor, offset the indices based on the current primitive.
                if (attributeKey === 'INDEX') {
                    value += indexOffset;
                    if (value > maxIndex) {
                        maxIndex = value;
                    }
                }
                writeBufferComponent(accessorSource, accessor.componentType, value, accessorSourceOffset + k * componentByteLength);
                min[k] = Math.min(min[k], value);
                max[k] = Math.max(max[k], value);
            }
            byteOffset += accessorByteStride;
            accessorSourceOffset += elementByteLength;
        }
        //Update the properties for the new accessor.
        count += accessor.count;
        source = Buffer.concat([source, accessorSource]);

        // If it exists, add the target to the new bufferView object.
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
    while (objectKeys.indexOf(newId) !== -1) {
        idCount++;
        newId = newId.slice(0, -1) + idCount;
    }
    return newId;
}

//Outputs a warning if there are extensions or non-pipeline extras in the object that will be lost.
function checkCombineWarning(object, objectType, objectId) {
    if (defined(object.extensions) || (defined(object.extras) && Object.keys(object.extras).length > 1)) {
        console.log('Warning: Extensions and extras for ' + objectType + ' "' + objectId + '" will be lost.');
    }
}