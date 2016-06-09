'use strict';
var argv = require('yargs').argv;
var path = require('path');
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var writeGltf = require('../lib/writeGltf');
var writeBinaryGltf = require('../lib/writeBinaryGltf');
var gltfPipeline = require('../lib/gltfPipeline');
var processFileToDisk = gltfPipeline.processFileToDisk;
var addPipelineExtras = require('../lib/addPipelineExtras');
var readGltf = require('../lib/readGltf');

if (process.argv.length < 3 || defined(argv.h) || defined(argv.help)) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.gltf or path-to.bgltf] [OPTIONS]\n' +
        '  -i --input, input=PATH Read unoptimized glTF from the specified file.\n' +
        '  -o --output, output=PATH write optimized glTF to the specified file.\n' +
        '  -b --binary, write binary glTF file.\n' +
        '  -s --separate, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.\n' +
        '  -t --separateTexture, write out separate textures, but embed geometry/animation data files, and shader files.\n';
    process.stdout.write(help);
    return;
}

var gltfPath = defaultValue(argv._[0], argv.i || argv.input);
var fileExtension = path.extname(gltfPath);
var fileName = path.basename(gltfPath, fileExtension);
var filePath = path.dirname(gltfPath);

var outputPath = defaultValue(argv._[1], argv.o || argv.output);
var isBinary = defaultValue(argv.b || argv.binary, false);
var isSeparate = defaultValue(argv.s || argv.separate, false);
var isTextureSeparate = defaultValue(argv.t || argv.separateTexture, false);

if (!defined(gltfPath)) {
    throw new DeveloperError('Input path is undefined.');
}

if (fileExtension !== '.glb' && fileExtension !== '.gltf') {
    throw new DeveloperError('Invalid glTF file.');
}

if (!defined(outputPath)) {
    // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
    outputPath = path.join(filePath, fileName + '-optimized' + fileExtension);
}

var options = {
    isBinary : isBinary,
    isEmbedded : !isSeparate,
    isImageEmbedded : !isTextureSeparate
};

processFileToDisk(gltfPath, outputPath, options);
