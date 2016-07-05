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
        '  --ao.diffuse, bake ambient occlusion into the diffuse texture. Defaults to false.\n' +
        '  --ao.scene, specify which scene to bake AO for. Defaults to the gltf default scene.\n' +
        '  --ao.rayDepth, ray distance for raytraced ambient occlusion. Defaults to 1.0 units in world space.\n' +
        '  --ao.resolution, number of texel samples along one dimension for each AO texture. Defaults to 128.\n' +
        '  --ao.samples, sample count for ambient occlusion texel. Clamps to the nearest smaller perfect square. Defaults to 16.\n';
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

var aoOptions;
if (argv.ao.diffuse) {
    aoOptions = {
        scene : argv.ao.scene,
        rayDepth : defaultValue(argv.ao.rayDepth, 1.0),
        resolution : defaultValue(argv.ao.resolution, 128),
        numberSamples : defaultValue(argv.ao.samples, 16)
    };
}

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
    imageProcess : defined(aoOptions)
};

processFileToDisk(gltfPath, outputPath, options);
