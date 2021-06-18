'use strict';
const Cesium = require('cesium');
const draco3d = require('draco3d');
const Promise = require('bluebird');
const ForEach = require('./ForEach');
const addAccessor = require('./addAccessor');
const addBuffer = require('./addBuffer');
const arrayFill = Cesium.arrayFill;

const defined = Cesium.defined;

let decoderModulePromise;

module.exports = decompressDracoMeshes;

/**
 * Decompresses meshes using Draco compression from the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} options The same options object as {@link processGltf}
 * @returns {Promise} A promise that resolves to the glTF asset with compressed meshes.
 *
 * @private
 */
function decompressDracoMeshes(gltf, options) {
    if (!defined(decoderModulePromise)) {
        // Prepare encoder for compressing meshes.
        decoderModulePromise = Promise.resolve(draco3d.createDecoderModule({}));
    }

    return decoderModulePromise.then(function(decoderModule) {
        return decompress(gltf, options, decoderModule);
    });
}

// TODO store those buffers somewhere to prevent doing the conversion everytime.
function getBuffer(gltf, bufferId){
  const buffer = gltf.buffers[bufferId];
  if (defined(buffer.url)){
    // TODO check if URL is a file or not !!!
    const data = buffer.url.split(',')[1];
    return Buffer.from(data).toString('base64');
  } else if (defined(buffer.extras) && defined(buffer.extras._pipeline)) {
    return buffer.extras._pipeline.source;
  }
}

function retrieveDracoBuffer(gltf, bufferViewId) {

  const bufferView = gltf.bufferViews[bufferViewId];

  const buffer = getBuffer(gltf, bufferView.buffer);

  return Buffer.from(buffer.buffer, bufferView.byteOffset, bufferView.byteLength);

}

function decodeDracoData(rawBuffer, decoderModule, decoder) {

  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
  const geometryType = decoder.GetEncodedGeometryType(buffer);

  let dracoGeometry;
  let status;
  if (geometryType === decoderModule.TRIANGULAR_MESH) {
    dracoGeometry = new decoderModule.Mesh();
    status = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    if (!status.ok()) {
      console.error(`Could not decode Draco mesh: ${status.error_msg()}`);
    }
  } else {
    const errorMsg = 'Error: Unknown geometry type.';
    console.error(errorMsg);
  }
  decoderModule.destroy(buffer);

  return dracoGeometry;
}

function decompress(gltf, options, decoderModule) {

    gltf._work = {
      gltf: {
        buffers:[],
        bufferViews:[],
        accessors:[]
      }
    };

    ForEach.mesh(gltf, (mesh) => {
        ForEach.meshPrimitive(mesh, (primitive) => {

          if (defined(primitive.extensions) && defined(primitive.extensions.KHR_draco_mesh_compression) ) {

            const draco_extension = primitive.extensions.KHR_draco_mesh_compression;

            // retrieve the DracoBuffer from the bufferview
            const buffer = retrieveDracoBuffer(gltf, draco_extension.bufferView);

            // Decode draco data
            const decoder = new decoderModule.Decoder();
            const mesh = decodeDracoData(buffer, decoderModule, decoder);
            decoderModule.destroy(decoder);

            const numFaces = mesh.num_faces();
            const numIndices = numFaces * 3;
            const numPoints = mesh.num_points();
            const indices = new Uint32Array(numIndices);

            // retrieve indices
            const ia = new decoderModule.DracoInt32Array();
            for (let i = 0; i < numFaces; ++i) {
              decoder.GetFaceFromMesh(mesh, i, ia);
              const index = i * 3;
              indices[index] = ia.GetValue(0);
              indices[index + 1] = ia.GetValue(1);
              indices[index + 2] = ia.GetValue(2);
            }
            decoderModule.destroy(ia);

            const bufferView_indices = addBuffer(gltf._work.gltf, new Uint8Array(indices.buffer) );
            const indices_accessor = addAccessor(gltf._work.gltf, bufferView_indices, numIndices, 'UNSIGNED_INT', 1);

            primitive.indices = indices_accessor;

            // Retrieve accessors data
            const attrs = {POSITION: 3, NORMAL: 3, COLOR: 3, TEX_COORD: 2};
            const attributes_accessors = {};
            Object.keys(attrs).forEach((attr) => {

              const stride = attrs[attr];
              const numValues = numPoints * stride;
              const decoderAttr = decoderModule[attr];
              const attrId = decoder.GetAttributeId(mesh, decoderAttr);

              if (attrId < 0) {
                return;
              }

              const attribute = decoder.GetAttribute(mesh, attrId);
              const attributeData = new decoderModule.DracoFloat32Array();
              decoder.GetAttributeFloatForAllPoints(mesh, attribute, attributeData);

              const min = arrayFill(new Array(stride), Number.POSITIVE_INFINITY);
              const max = arrayFill(new Array(stride), Number.NEGATIVE_INFINITY);

              const attributeDataArray = new Float32Array(numValues);
              for (let i = 0; i < numValues; ++i) {
                attributeDataArray[i] = attributeData.GetValue(i);

                const index = i % stride;
                min[index] = Math.min(min[index], attributeDataArray[i]);
                max[index] = Math.max(max[index], attributeDataArray[i]);
              }

              const bufferViewId = addBuffer(gltf._work.gltf, new Uint8Array(attributeDataArray.buffer));

              attributes_accessors[attr] = addAccessor(gltf._work.gltf, bufferViewId, numPoints, 'FLOAT', stride, { min: min, max: max});

              decoderModule.destroy(attributeData);

            });

            primitive.attributes = attributes_accessors;

            delete primitive.extensions.KHR_draco_mesh_compression;

          }

        });
    });

    // Translating this into the decoded gltf
    gltf.buffers = gltf._work.gltf.buffers;
    gltf.bufferViews = gltf._work.gltf.bufferViews;
    gltf.accessors = gltf._work.gltf.accessors;

    delete gltf._work;

    gltf.extensionsUsed = gltf.extensionsUsed.filter(extension => extension !== 'KHR_draco_mesh_compression');

}
