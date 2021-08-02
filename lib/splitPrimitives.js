"use strict";
const Cesium = require("cesium");
const hashObject = require("object-hash");
const addBuffer = require("./addBuffer");
const addToArray = require("./addToArray");
const findAccessorMinMax = require("./findAccessorMinMax");
const ForEach = require("./ForEach");
const readAccessorPacked = require("./readAccessorPacked");
const removeUnusedElements = require("./removeUnusedElements");

const clone = Cesium.clone;
const ComponentDatatype = Cesium.ComponentDatatype;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const numberOfComponentsForType = Cesium.numberOfComponentsForType;

module.exports = splitPrimitives;

/**
 * Splits primitives that reference different indices within the same mesh.
 * This stage is used internally by compressDracoMeshes.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} glTF with primitives split.
 *
 * @private
 */
function splitPrimitives(gltf) {
  let i;
  let hash;
  let primitives;
  let primitivesLength;

  const hashPrimitives = {};
  const duplicatePrimitives = {};
  const primitivesWithSharedAttributes = {};
  let primitivesSplit = false;

  ForEach.mesh(gltf, function (mesh) {
    ForEach.meshPrimitive(mesh, function (primitive) {
      const hashPrimitive = hashObject({
        indices: primitive.indices,
        attributes: primitive.attributes,
        targets: primitive.targets,
        mode: primitive.mode,
      });
      if (defined(hashPrimitives[hashPrimitive])) {
        const duplicates = defaultValue(duplicatePrimitives[hashPrimitive], []);
        duplicatePrimitives[hashPrimitive] = duplicates;
        duplicates.push(primitive);
        return;
      }
      hashPrimitives[hashPrimitive] = primitive;

      const hashAttributes = hashObject({
        attributes: primitive.attributes,
        targets: primitive.targets,
        mode: primitive.mode,
      });
      const primitivesShared = defaultValue(
        primitivesWithSharedAttributes[hashAttributes],
        []
      );
      primitivesWithSharedAttributes[hashAttributes] = primitivesShared;
      primitivesShared.push(primitive);
    });
  });

  for (hash in primitivesWithSharedAttributes) {
    if (
      Object.prototype.hasOwnProperty.call(primitivesWithSharedAttributes, hash)
    ) {
      primitives = primitivesWithSharedAttributes[hash];
      primitivesLength = primitives.length;
      if (primitivesLength === 1) {
        continue;
      }
      primitivesSplit = true;
      const attributeData = readAttributes(gltf, primitives[0]);
      const targetData = readTargets(gltf, primitives[0]);
      for (i = 0; i < primitivesLength; ++i) {
        splitPrimitive(gltf, primitives[i], attributeData, targetData);
      }
    }
  }

  if (primitivesSplit) {
    for (hash in duplicatePrimitives) {
      if (Object.prototype.hasOwnProperty.call(duplicatePrimitives, hash)) {
        const primitiveToCopy = hashPrimitives[hash];
        primitives = duplicatePrimitives[hash];
        primitivesLength = primitives.length;
        for (i = 0; i < primitivesLength; ++i) {
          copyPrimitive(primitiveToCopy, primitives[i]);
        }
      }
    }
    removeUnusedElements(gltf, ["accessor", "bufferView", "buffer"]);
  }

  return gltf;
}

function copyPrimitive(primitiveToCopy, primitive) {
  primitive.indices = primitiveToCopy.indices;
  ForEach.meshPrimitiveAttribute(
    primitiveToCopy,
    function (accessorId, semantic) {
      primitive.attributes[semantic] = accessorId;
    }
  );
  ForEach.meshPrimitiveTarget(primitiveToCopy, function (target, targetIndex) {
    ForEach.meshPrimitiveTargetAttribute(
      target,
      function (accessorId, semantic) {
        primitive.targets[targetIndex][semantic] = accessorId;
      }
    );
  });
}

function splitPrimitive(gltf, primitive, attributeData, targetData) {
  const indicesAccessor = gltf.accessors[primitive.indices];
  const indices = readAccessorPacked(gltf, indicesAccessor);
  const mappedIndices = {};
  const newIndices = [];
  let uniqueIndicesLength = 0;
  const indicesLength = indices.length;
  for (let i = 0; i < indicesLength; ++i) {
    const index = indices[i];
    let mappedIndex = mappedIndices[index];
    if (!defined(mappedIndex)) {
      mappedIndex = uniqueIndicesLength++;
      mappedIndices[index] = mappedIndex;
    }
    newIndices.push(mappedIndex);
  }
  primitive.indices = createNewAccessor(gltf, indicesAccessor, newIndices);

  ForEach.meshPrimitiveAttribute(primitive, function (accessorId, semantic) {
    primitive.attributes[semantic] = createNewAttribute(
      gltf,
      accessorId,
      semantic,
      attributeData,
      mappedIndices,
      uniqueIndicesLength
    );
  });

  ForEach.meshPrimitiveTarget(primitive, function (target, targetIndex) {
    ForEach.meshPrimitiveTargetAttribute(
      target,
      function (accessorId, semantic) {
        target[semantic] = createNewAttribute(
          gltf,
          accessorId,
          semantic,
          targetData[targetIndex],
          mappedIndices,
          uniqueIndicesLength
        );
      }
    );
  });
}

function createNewAttribute(
  gltf,
  accessorId,
  semantic,
  attributeData,
  mappedIndices,
  uniqueIndicesLength
) {
  const accessor = gltf.accessors[accessorId];
  const numberOfComponents = numberOfComponentsForType(accessor.type);
  const dataArray = attributeData[semantic];
  const newDataArray = new Array(uniqueIndicesLength * numberOfComponents);
  remapData(dataArray, newDataArray, mappedIndices, numberOfComponents);
  return createNewAccessor(gltf, accessor, newDataArray);
}

function remapData(dataArray, newDataArray, mappedIndices, numberOfComponents) {
  for (const index in mappedIndices) {
    if (Object.prototype.hasOwnProperty.call(mappedIndices, index)) {
      const mappedIndex = mappedIndices[index];
      for (let i = 0; i < numberOfComponents; ++i) {
        newDataArray[mappedIndex * numberOfComponents + i] =
          dataArray[index * numberOfComponents + i];
      }
    }
  }
}

function createNewAccessor(gltf, oldAccessor, dataArray) {
  const componentType = oldAccessor.componentType;
  const type = oldAccessor.type;
  const numberOfComponents = numberOfComponentsForType(type);
  const count = dataArray.length / numberOfComponents;
  const newBuffer = Buffer.from(
    ComponentDatatype.createTypedArray(componentType, dataArray).buffer
  );
  const newBufferViewId = addBuffer(gltf, newBuffer);

  const accessor = clone(oldAccessor, true);
  const accessorId = addToArray(gltf.accessors, accessor);

  accessor.bufferView = newBufferViewId;
  accessor.byteOffset = 0;
  accessor.count = count;

  const minMax = findAccessorMinMax(gltf, accessor);
  accessor.min = minMax.min;
  accessor.max = minMax.max;

  return accessorId;
}

function readAttributes(gltf, primitive) {
  const attributeData = {};
  ForEach.meshPrimitiveAttribute(primitive, function (accessorId, semantic) {
    attributeData[semantic] = readAccessorPacked(
      gltf,
      gltf.accessors[accessorId]
    );
  });
  return attributeData;
}

function readTargets(gltf, primitive) {
  const targetData = [];
  ForEach.meshPrimitiveTarget(primitive, function (target) {
    const attributeData = {};
    targetData.push(attributeData);
    ForEach.meshPrimitiveTargetAttribute(
      target,
      function (accessorId, semantic) {
        attributeData[semantic] = readAccessorPacked(
          gltf,
          gltf.accessors[accessorId]
        );
      }
    );
  });
  return targetData;
}
