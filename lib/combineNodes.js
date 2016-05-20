'use strict';
var arrayEqual = require('array-equal');
var Cesium = require('cesium');
var clone = Cesium.clone;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var IDENTITY = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
module.exports = combineNodes;

//Combines nodes which are not targeted for animation and share the same material. 
//Should be run after the combineMeshes and combinePrimitives stages, giving nodes one mesh each.
function combineNodes(gltf, preserveCameras) {
    var animations = gltf.animations;
    var nodes = gltf.nodes;

    //Give each node an extra property to check if they are not targeted for animation.
    for (var animationId in animations) {
        if (animations.hasOwnProperty(animationId)) {
            var animation = animations[animationId];
            if (defined(animation.channels)) {
                var channelLength = animation.channels.length;
                for (var i = 0; i < channelLength; i++) {
                    nodes[animation.channels[i].target.id].extras._pipeline.isMergeable = false;
                }
            }
        }
    }
    for (var nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
            var node = nodes[nodeId];
            if (!defined(node.extras._pipeline.isMergeable)) {
                node.extras._pipeline.isMergeable = true;
            }
        }
    }

    var scenes = gltf.scenes;
    //Traverse the node tree and combine nodes from the bottom up.
    if (defined(scenes)) {
        for (var sceneId in scenes) {
            if (scenes.hasOwnProperty(sceneId)) {
                var roots = scenes[sceneId].nodes;
                if (defined(roots)) {
                    var rootsLength = roots.length;
                    for (var j = 0; j < rootsLength; j++) {
                        combineSubtree(gltf, roots[j], preserveCameras);
                    }
                }
            }
        }
    }

    return gltf;
}

//Recursively combines the children of a subtree from the bottom up.
function combineSubtree(gltf, rootId, preserveCameras) {
    var nodes = gltf.nodes;
    var root = nodes[rootId];
    var children = root.children;
    if (defined(children) && children.length > 0) {
        var childrenLength = children.length;
        for (var i = 0; i < childrenLength; i++) {
            combineSubtree(gltf, children[i], preserveCameras);
        }

        //Merge the children which are not animated and have the same properties into the current subtree root.
        var childIndex = 0;
        while (childIndex < children.length) {
            var childId = children[childIndex];
            var child = nodes[childId];
            if (canCombine(root, child, preserveCameras)) {
                mergeChildWithParent(gltf, rootId, childId, childIndex, preserveCameras);
                children.splice(childIndex, 1);
            }
            else {
                childIndex++;
            }
        }
        root.children = children;
    }
}

//Returns true if the child has the necessary properties to be combined with its parent.
function canCombine(parent, child, preserveCameras) {
    if (!child.extras._pipeline.isMergeable) {
        //If the child is animated, merging the parent node may lose transformation information for the child.
        parent.extras._pipeline.isMergeable = false;
        return false;
    }

    if (defined(parent.skeletons) !== defined(child.skeletons) || (defined(parent.skeletons) && (!arrayEqual(parent.skeletons.sort(), child.skeletons.sort()))) ||
            propertyNotShared(parent, child, 'skins') ||
            propertyNotShared(parent, child, 'jointName')) {
        return false;
    }
    if (preserveCameras && (parent.camera !== child.camera)) {
        return false;
    }

    return true;
}

//Merges the child into the parent node, transforming the mesh data if needed.
function mergeChildWithParent(gltf, parentId, childId, childIndex, preserveCameras) {
    var nodes = gltf.nodes;
    var parent = nodes[parentId];
    var child = nodes[childId];
    checkCombineWarning(child, 'node', childId);

    var meshes = gltf.meshes;
    //Duplicate and transform the child's mesh data if the node has a transformation, and add the mesh to the parent.
    var transform = child.matrix;
    if (defined(child.meshes) && child.meshes.length > 0) {
        var meshId = child.meshes[0];
        var newMeshId = meshId;
        if (defined(transform) && !arrayEqual(transform, IDENTITY)) {
            newMeshId += '_0';
            var idCount = 0;
            var meshKeys = Object.keys(meshes);
            while (meshKeys.indexOf(newMeshId) !== -1) {
                idCount++;
                newMeshId = newMeshId.slice(0, -1) + idCount;
            }

            var mesh = gltf.meshes[meshId];
            var newMesh = clone(mesh, true);
            var primitives = newMesh.primitives;
            if (defined(primitives)) {
                var primitivesLength = primitives.length;
                for (var i = 0; i < primitivesLength; i++) {
                    var attributes = primitives[i].attributes;
                    if (defined(attributes)) {
                        transformAttribute(gltf, meshId, transform, 'POSITION', attributes, gltf.accessors, gltf.buffers, gltf.bufferViews);
                        transformAttribute(gltf, meshId, transform, 'NORMAL', attributes, gltf.accessors, gltf.buffers, gltf.bufferViews);
                    }
                }
            }
            meshes[newMeshId] = newMesh;
        }
        if (defined(parent.meshes)) {
            parent.meshes.push(newMeshId);
        }
        else {
            parent.meshes = [newMeshId];
        }
    }

    //If we are preseving cameras, the two nodes should already have the same camera.
    //If not, remove the property if the two nodes do not have the same camera.
    if (!preserveCameras && propertyNotShared(parent, child, 'camera')) {
        delete parent.camera;
    }
    delete parent.name;

    //Append the children of the child to the parent.
    if (defined(child.children)) {
        parent.children = parent.children.concat(child.children);
    }

    delete nodes[childId];
    return parent;
}

//Transforms the attribute data and creates a new accessor, buffer view, and buffer to access the data.
function transformAttribute(gltf, meshId, transform, attributeId, attributes, accessors, buffers, bufferViews) {
    if (Object.keys(attributes).indexOf(attributeId) !== -1) {
        var accessorId = attributes[attributeId];
        var attributeAccessor = accessors[accessorId];
        checkCombineWarning(attributeAccessor, 'accessor', accessorId);

        var attributeBufferView = bufferViews[attributeAccessor.bufferView];
        checkCombineWarning(attributeBufferView, 'bufferView', attributeAccessor.bufferView);

        var attributeBuffer = buffers[attributeBufferView.buffer];
        checkCombineWarning(attributeBuffer, 'buffer', attributeBufferView.buffer);

        var bufferViewSource = attributeBuffer.extras._pipeline.source.slice(attributeBufferView.byteOffset, attributeBufferView.byteOffset + attributeBufferView.byteLength);
        var accessorSource = bufferViewSource.slice(attributeAccessor.byteOffset, attributeAccessor.byteOffset + attributeAccessor.count * defaultValue(attributeAccessor.byteStride, 12));
        var premultipliedSource = premultiplyTransformWithBuffer(transform, accessorSource, attributeId, attributeAccessor.min, attributeAccessor.max);
        var premultipliedSourceLength = premultipliedSource.length;

        var newAccessorId = createNewId(gltf, meshId, attributeId, 'accessor');
        var newBufferId = createNewId(gltf, meshId, attributeId, 'buffer');
        var newBufferViewId = createNewId(gltf, meshId, attributeId, 'bufferView');

        var newBuffer = {
            "type": "arraybuffer",
            "byteLength": premultipliedSourceLength,
            "uri": "data:,",
            "extras": {
                "_pipeline": {
                    "extension": ".bin",
                    "source": premultipliedSource,
                    "deleteExtras": true
                }
            }
        };
        var newBufferView = {
            "buffer": newBufferId,
            "byteOffset": 0,
            "byteLength": premultipliedSourceLength,
            "extras": {
                "_pipeline": {
                    "deleteExtras": true
                }
            }
        };

        if (defined(attributeBufferView.target)) {
            newBufferView.target = attributeBufferView.target;
        }

        var newAccessor = clone(attributeAccessor, true);
        newAccessor.byteOffset = 0;
        newAccessor.bufferView = newBufferViewId;

        attributes[attributeId] = newAccessorId;
        accessors[newAccessorId] = newAccessor;
        bufferViews[newBufferViewId] = newBufferView;
        buffers[newBufferId] = newBuffer;
    }
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

//Returns a row from the column-major matrix.
function getMatrixRow(matrix, rowIndex) {
    return [matrix[0 + rowIndex], matrix[4 + rowIndex], matrix[8 + rowIndex], matrix[12 + rowIndex]];
}

//Multiplies a 4x4 matrix with a 4 component vector.
function matrixMultiply(matrix, vector) {
    return [dot(getMatrixRow(matrix, 0), vector), dot(getMatrixRow(matrix, 1), vector), 
            dot(getMatrixRow(matrix, 2), vector), dot(getMatrixRow(matrix, 3), vector)];
}

//Returns a new buffer with the elements premultiplied by the transform matrix.
function premultiplyTransformWithBuffer(matrix, buffer, attributeId, min, max) {
    var bufferLength = buffer.length;
    var resultBuffer = new Buffer(bufferLength);
    var bufferIndex = 0;
    var currentVector = [0, 0, 0, 0];
    if (attributeId === 'POSITION') {
        currentVector[3] = 1;
    }

    while (bufferIndex < bufferLength) {
        currentVector[0] = buffer.readFloatLE(bufferIndex);
        currentVector[1] = buffer.readFloatLE(bufferIndex + 4);
        currentVector[2] = buffer.readFloatLE(bufferIndex + 8);

        var newVector = matrixMultiply(matrix, currentVector);
        resultBuffer.writeFloatLE(newVector[0], bufferIndex);
        resultBuffer.writeFloatLE(newVector[1], bufferIndex + 4);
        resultBuffer.writeFloatLE(newVector[2], bufferIndex + 8);

        //Update the min and max values if defined.
        if (defined(min)) {
            if (newVector[0] < min[0]) {
                min[0] = newVector[0];
            }
            if (newVector[1] < min[1]) {
                min[1] = newVector[1];
            }
            if (newVector[2] < min[2]) {
                min[2] = newVector[2];
            }
        }
        if (defined(max)) {
            if (newVector[0] > max[0]) {
                max[0] = newVector[0];
            }
            if (newVector[1] > max[1]) {
                max[1] = newVector[1];
            }
            if (newVector[2] > max[2]) {
                max[2] = newVector[2];
            }
        }

        bufferIndex += 12;
    }

    return resultBuffer;
}

function propertyNotShared(nodeA, nodeB, property) {
    return defined(nodeA[property]) !== defined(nodeB[property]) || (defined(nodeA[property]) && (nodeA[property] !== nodeB[property]));
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

//Outputs a warning if there are extensions or non-pipeline extras in the object that will be lost.
function checkCombineWarning(object, objectType, objectId) {
    if (defined(object.extensions) || (defined(object.extras) && Object.keys(object.extras).length > 1)) {
        console.log('Warning: Extensions and extras for ' + objectType + ' "' + objectId + '" will be lost.');
    }
}
