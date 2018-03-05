'use strict';
var parseGlb = require('./parseGlb');
var gltfToGlb = require('./gltfToGlb');

module.exports = processGlb;

/**
 * Run a glb through the gltf-pipeline.
 *
 * @param {Buffer} glb A buffer containing the glb contents.
 * @param {Object} [options] The same options object as {@link processGltf}
 * @returns {Promise} A promise that resolves to a buffer containing the glb contents.
 */
function processGlb(glb, options) {
    var gltf = parseGlb(glb);
    return gltfToGlb(gltf, options);
}
