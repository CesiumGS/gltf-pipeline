'use strict';
module.exports = removeNormals;

/**
 * Removes normals from primitives. If the technique and shader use normals, they are removed, using the default material.
 *
 * The glTF asset must be initialized for the pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with removed normals.
 *
 * @see addPipelineExtras
 * @see loadGltfUris
 */
function removeNormals(gltf) {

}