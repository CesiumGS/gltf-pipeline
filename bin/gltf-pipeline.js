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
        '  -i, input=PATH Read unoptimized glTF from the specified file.\n ' +
        '  -o, output=PATH write optimized glTF to the specified file.\n' +
        '  -b, write binary glTF file.\n' +
        '  -s, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.\n  ';
    process.stdout.write(help);
    return;
}

var gltfPath = defaultValue(argv._[0], argv.i);
var fileExtension = path.extname(gltfPath);
var fileName = path.basename(gltfPath, fileExtension);
var filePath = path.dirname(gltfPath);

var outputPath = defaultValue(argv._[1], argv.o);
var isSeparate = defaultValue(argv.s, false);
var isBinary = defaultValue(argv.b, false);

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
    isEmbedded : !isSeparate
};

processFileToDisk(gltfPath, outputPath, options);
