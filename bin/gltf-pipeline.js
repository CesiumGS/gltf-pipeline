'use strict';
var argv = require('yargs').argv;
var path = require('path');
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var gltfPipeline = require('../lib/gltfPipeline');
var processFileToDisk = gltfPipeline.processFileToDisk;

if (process.argv.length < 3 || defined(argv.h) || defined(argv.help)) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.gltf or path-to.bgltf] [OPTIONS]\n' +
        '  -i --input, input=PATH Read unoptimized glTF from the specified file.\n' +
        '  -o --output, output=PATH write optimized glTF to the specified file.\n' +
        '  -b --binary, write binary glTF file.\n' +
        '  -s --separate, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.\n' +
        '  -t --separateImage, write out separate textures, but embed geometry/animation data files, and shader files.\n' +
        '  -q --quantize, quantize the attributes of this model.\n' +
        '  -n --encodeNormals, oct-encode the normals of this model.\n' +
        '  -c --compressTextureCoordinates, compress the texture coordinates of this model.\n' +
        '  --ao: Bake ambient occlusion to vertex data using default settings if no others are specified. Default: inactive.\n' +
        '  --ao.toTexture: Bake AO to existing diffuse textures instead of to vertices. Does not modify shaders. Default: inactive.\n' +
        '  --ao.groundPlane: Simulate a ground plane at the lowest point of the model when baking AO. Default: inactive.\n' +
        '  --ao.ambientShadowContribution: Amount of AO to show when blending between shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend. Default: 0.5\n' +
        '  --ao.quality: Valid settings are high, medium, and low. Default: low\n';
    process.stdout.write(help);
    return;
}

var gltfPath = defaultValue(argv._[0], defaultValue(argv.i, argv.input));
var outputPath = defaultValue(argv._[1], defaultValue(argv.o, argv.output));
var binary = defaultValue(defaultValue(argv.b, argv.binary), false);
var separate = defaultValue(defaultValue(argv.s, argv.separate), false);
var separateImage = defaultValue(defaultValue(argv.t, argv.separateImage), false);
var quantize = defaultValue(defaultValue(argv.q, argv.quantize), false);
var encodeNormals = defaultValue(defaultValue(argv.n, argv.encodeNormals), false);
var compressTextureCoordinates = defaultValue(defaultValue(argv.c, argv.compressTextureCoordinates), false);
var aoOptions = argv.ao;

if (!defined(outputPath)) {
    var outputFileExtension;
    if (binary) {
        outputFileExtension = '.glb';
    } else {
        outputFileExtension = '.gltf';
    }
    var fileExtension = path.extname(gltfPath);
    var fileName = path.basename(gltfPath, fileExtension);
    var filePath = path.dirname(gltfPath);
    // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
    outputPath = path.join(filePath, fileName + '-optimized' + outputFileExtension);
}

var options = {
    binary : binary,
    embed : !separate,
    embedImage : !separateImage,
    quantize : quantize,
    encodeNormals : encodeNormals,
    compressTextureCoordinates : compressTextureCoordinates,
    aoOptions : aoOptions,
    imageProcess : defined(aoOptions) && aoOptions.toTexture
};

processFileToDisk(gltfPath, outputPath, options);
