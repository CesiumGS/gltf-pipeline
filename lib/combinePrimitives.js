'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;
var createNewId = require('./createNewId');
var checkCombineWarning = require('./checkCombineWarning');
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
    var byteStride = defaultValue(referenceAccessor.byteStride, 0);
    var componentType = referenceAccessor.componentType;
    var type = referenceAccessor.type;
    var count = 0;
    var target, max, min;
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

        //If the current accessor has a different type or componentType, throw an error.
        if (accessor.componentType !== componentType || accessor.type !== type) {
            throw new DeveloperError('Attributes cannot reference accessors with different types or componentTypes.');
        }
        checkCombineWarning(accessor, 'accessor', accessorId);

        //Update the properties for the new accessor.
        count += accessor.count;
        if (defined(accessor.max)) {
            if (defined(max)) {
                for (var j = 0; j < max.length; j++) {
                    if (accessor.max[j] > max[j]) {
                        max[j] = accessor.max[j];
                    }
                }
            }
            else {
                max = accessor.max;
            }
        }
        if (defined(accessor.min)) {
            if (defined(min)) {
                for (var k = 0; k < min.length; k++) {
                    if (accessor.min[k] < min[k]) {
                        min[k] = accessor.min[k];
                    }
                }
            }
            else {
                min = accessor.min;
            }
        }

        //Obtain the source from the accessor's bufferview and append to the new source.
        var bufferView = bufferViews[accessor.bufferView];
        checkCombineWarning(bufferView, 'bufferView', accessor.bufferView);
        var viewByteOffset = bufferView.byteOffset;
        var viewByteLength = defaultValue(bufferView.byteLength, 0);

        var buffer = buffers[bufferView.buffer];
        checkCombineWarning(buffer, 'buffer', bufferView.buffer);
        var bufferSource = buffer.extras._pipeline.source;
        var bufferViewSource = bufferSource.slice(viewByteOffset, viewByteOffset + viewByteLength);

        //Calculate the length of the accessor source using the count and byteStride or componentType.
        var accessorByteLength = accessor.count;
        if (accessor.byteStride > 0) {
            accessorByteLength *= accessor.byteStride;
        }
        else {
            //Int16
            if (accessor.componentType === WebGLConstants.SHORT || accessor.componentType === WebGLConstants.UNSIGNED_SHORT) {
                accessorByteLength *= 2;
            }
            //Float32
            if (accessor.componentType === WebGLConstants.FLOAT) {
                accessorByteLength *= 4;
            }
        }
        var accessorSource = new Buffer(bufferViewSource.slice(accessor.byteOffset, accessor.byteOffset + accessorByteLength));
        
        //If we are creating an index accessor, offset the indices based on the current primitive.
        if (!defined(attributeType)) {
            var prevMaxIndex = maxIndex + 1;
            var accessorIndex = 0;
            while (accessorIndex < accessorSource.length) {
                var index = prevMaxIndex;
                if (accessor.componentType === WebGLConstants.UNSIGNED_BYTE) {
                    index += accessorSource.readUInt8LE(accessorIndex);
                    accessorSource.writeUInt8LE(index, accessorIndex);
                    accessorIndex++;
                }
                else if (accessor.componentType === WebGLConstants.UNSIGNED_SHORT) {
                    index += accessorSource.readUInt16LE(accessorIndex);
                    accessorSource.writeUInt16LE(index, accessorIndex);
                    accessorIndex += 2;
                }

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